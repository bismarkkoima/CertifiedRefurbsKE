from datetime import datetime
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, AdminUser
from app.api.v1.endpoints.listings import detail
from app.db.models import (ContactMessage, Coupon, EscrowStatus, Grade, ImportRequest, NewsletterSubscriber, Order,
                           OrderItem, OrderStatus, Product, ProductVariant, Review, TradeIn,
                           User)
from app.core.security import hash_password
from app.db.seed import product_slug
from app.schemas import (AdminProductCreate, AdminProductUpdate, AdminStats, AdminVariantCreate, AdminVariantUpdate,
                         ImportRequestOut, OrderOut, ProductDetail, TradeInOut, UserCreate, UserOut)
from app.services.orders import add_event
from app.services.pricing import GRADE_BATTERY, grade_price, tier_prices

router = APIRouter()

PAID_STATES = (OrderStatus.paid, OrderStatus.processing, OrderStatus.shipped,
               OrderStatus.delivered, OrderStatus.completed)
STATUS_EVENTS = {
    OrderStatus.processing: ("Quality check passed", "Your device passed its final inspection and is being packed."),
    OrderStatus.shipped: ("Out for delivery", "Your rider is on the way. Confirm delivery to release escrow."),
    OrderStatus.delivered: ("Delivered", "Please confirm delivery so we can release escrow funds."),
    OrderStatus.cancelled: ("Order cancelled", "Any escrow funds are refunded to your M-Pesa."),
}


class StatusUpdate(BaseModel):
    status: Literal["processing", "shipped", "delivered", "cancelled"]


class CouponIn(BaseModel):
    code: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_-]+$")
    description: str = Field(default="", max_length=160)
    percent_off: int = Field(default=0, ge=0, le=90)
    amount_off: int = Field(default=0, ge=0)
    max_discount: int | None = Field(default=None, ge=0)
    min_subtotal: int = Field(default=0, ge=0)
    max_uses: int | None = Field(default=None, ge=1)


class CouponOut(CouponIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    uses: int
    active: bool


def _product(db, product_id: int) -> Product:
    product = db.scalar(select(Product).where(Product.id == product_id).options(selectinload(Product.variants)))
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@router.get("/stats", response_model=AdminStats)
def stats(db: DB, _: AdminUser):
    recent = db.scalars(
        select(Order).options(selectinload(Order.items), selectinload(Order.events))
        .order_by(Order.created_at.desc()).limit(10)
    ).all()
    return AdminStats(
        revenue=db.scalar(select(func.coalesce(func.sum(Order.total), 0)).where(Order.status.in_(PAID_STATES))),
        orders=db.scalar(select(func.count(Order.id))),
        paid_orders=db.scalar(select(func.count(Order.id)).where(Order.status.in_(PAID_STATES))),
        pending_orders=db.scalar(select(func.count(Order.id)).where(Order.status == OrderStatus.pending_payment)),
        products=db.scalar(select(func.count(Product.id))),
        units_in_stock=db.scalar(select(func.coalesce(func.sum(ProductVariant.stock), 0))),
        customers=db.scalar(select(func.count(User.id)).where(User.is_admin.is_(False))),
        import_requests=db.scalar(select(func.count(ImportRequest.id))),
        trade_ins=db.scalar(select(func.count(TradeIn.id))),
        recent_orders=recent,
    )


@router.patch("/orders/{number}", response_model=OrderOut)
def update_order_status(number: str, data: StatusUpdate, db: DB, _: AdminUser):
    order = db.scalar(select(Order).where(Order.number == number.upper())
                      .options(selectinload(Order.items), selectinload(Order.events)))
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status in (OrderStatus.completed, OrderStatus.cancelled):
        raise HTTPException(409, f"Order is already {order.status.value}")
    new_status = OrderStatus(data.status)
    if new_status != OrderStatus.cancelled and order.status == OrderStatus.pending_payment:
        raise HTTPException(409, "Order has not been paid yet")
    order.status = new_status
    if new_status == OrderStatus.cancelled and order.escrow_status == EscrowStatus.held:
        order.escrow_status = EscrowStatus.refunded
    add_event(order, *STATUS_EVENTS[new_status])
    db.commit()
    return order


@router.get("/products", response_model=list[ProductDetail])
def list_products(db: DB, _: AdminUser):
    products = db.scalars(select(Product).options(selectinload(Product.variants))
                          .order_by(Product.category, Product.brand, Product.year.desc())).all()
    return [detail(p) for p in products]


@router.post("/products", response_model=ProductDetail, status_code=201)
def create_product(data: AdminProductCreate, db: DB, _: AdminUser):
    item = data.model_dump()
    slug = product_slug(item)
    if db.scalar(select(Product.id).where(Product.slug == slug)):
        raise HTTPException(409, "A product with this brand and name already exists")
    hue = 220
    product = Product(
        slug=slug, name=data.name, brand=data.brand, category=data.category, year=data.year,
        tagline=data.tagline, subtitle=data.subtitle, description=data.description, specs=data.specs,
        colors=[c.model_dump() for c in data.colors], image_url=data.image_url, new_price=data.new_price, hue=hue,
    )
    for tier, storage in enumerate(data.storages):
        price, new_price = tier_prices(data.price, data.new_price, data.category, tier)
        for grade in Grade:
            product.variants.append(ProductVariant(
                grade=grade, storage=storage, price=grade_price(price, grade.value), new_price=new_price,
                stock=data.stock, battery_health=GRADE_BATTERY[grade.value],
            ))
    db.add(product)
    db.commit()
    return detail(_product(db, product.id))


@router.patch("/products/{product_id}", response_model=ProductDetail)
def update_product(product_id: int, data: AdminProductUpdate, db: DB, _: AdminUser):
    product = _product(db, product_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "image_url":
            value = value or None
        if value is None and key != "image_url":
            continue
        setattr(product, key, value)
    db.commit()
    return detail(product)


@router.patch("/variants/{variant_id}", response_model=ProductDetail)
def update_variant(variant_id: int, data: AdminVariantUpdate, db: DB, _: AdminUser):
    variant = db.get(ProductVariant, variant_id)
    if not variant:
        raise HTTPException(404, "Variant not found")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(variant, key, value)
    db.commit()
    return detail(_product(db, variant.product_id))


@router.get("/coupons", response_model=list[CouponOut])
def list_coupons(db: DB, _: AdminUser):
    return db.scalars(select(Coupon).order_by(Coupon.created_at.desc())).all()


@router.post("/coupons", response_model=CouponOut, status_code=201)
def create_coupon(data: CouponIn, db: DB, _: AdminUser):
    if not data.percent_off and not data.amount_off:
        raise HTTPException(422, "Set a percentage or an amount off")
    code = data.code.upper()
    if db.scalar(select(Coupon.id).where(func.upper(Coupon.code) == code)):
        raise HTTPException(409, "That code already exists")
    coupon = Coupon(**{**data.model_dump(), "code": code})
    db.add(coupon)
    db.commit()
    return coupon


@router.patch("/coupons/{coupon_id}", response_model=CouponOut)
def toggle_coupon(coupon_id: int, db: DB, _: AdminUser):
    coupon = db.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(404, "Coupon not found")
    coupon.active = not coupon.active
    db.commit()
    return coupon


@router.delete("/reviews/{review_id}", status_code=204)
def delete_review(review_id: int, db: DB, _: AdminUser):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(404, "Review not found")
    product_id = review.product_id
    db.delete(review)
    db.flush()
    count, avg = db.execute(select(func.count(Review.id), func.avg(Review.rating))
                            .where(Review.product_id == product_id)).one()
    product = db.get(Product, product_id)
    product.reviews_count, product.rating = count, round(float(avg or 0), 1)
    db.commit()


def _ordered(db, variant_ids: list[int]) -> bool:
    return bool(variant_ids) and bool(
        db.scalar(select(OrderItem.id).where(OrderItem.variant_id.in_(variant_ids)).limit(1))
    )


class DeleteResult(BaseModel):
    deleted: bool
    archived: bool = False
    message: str


@router.delete("/products/{product_id}", response_model=DeleteResult)
def delete_product(product_id: int, db: DB, _: AdminUser):
    """Hard-delete a product, or archive it if it has ever been ordered (keeps order history intact)."""
    product = _product(db, product_id)
    if _ordered(db, [v.id for v in product.variants]):
        product.active = False
        db.commit()
        return DeleteResult(deleted=False, archived=True,
                            message=f"{product.name} has past orders, so it was archived and hidden from the store.")
    db.delete(product)
    db.commit()
    return DeleteResult(deleted=True, message=f"{product.name} was deleted.")


@router.post("/products/{product_id}/variants", response_model=ProductDetail, status_code=201)
def create_variant(product_id: int, data: AdminVariantCreate, db: DB, _: AdminUser):
    product = _product(db, product_id)
    if any(v.grade.value == data.grade and v.storage == data.storage for v in product.variants):
        raise HTTPException(409, f"{data.storage} in {data.grade} grade already exists")
    product.variants.append(ProductVariant(
        grade=Grade(data.grade), storage=data.storage, price=data.price, new_price=data.new_price,
        stock=data.stock, battery_health=GRADE_BATTERY[data.grade],
    ))
    db.commit()
    return detail(_product(db, product_id))


@router.delete("/variants/{variant_id}", response_model=ProductDetail)
def delete_variant(variant_id: int, db: DB, _: AdminUser):
    variant = db.get(ProductVariant, variant_id)
    if not variant:
        raise HTTPException(404, "Variant not found")
    product_id = variant.product_id
    if _ordered(db, [variant.id]):
        raise HTTPException(409, "This option has past orders. Set its stock to 0 instead of deleting it.")
    if db.scalar(select(func.count(ProductVariant.id)).where(ProductVariant.product_id == product_id)) <= 1:
        raise HTTPException(409, "A product needs at least one option. Delete the product instead.")
    db.delete(variant)
    db.commit()
    return detail(_product(db, product_id))


@router.delete("/coupons/{coupon_id}", status_code=204)
def delete_coupon(coupon_id: int, db: DB, _: AdminUser):
    coupon = db.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(404, "Coupon not found")
    db.delete(coupon)
    db.commit()


@router.delete("/orders/{number}", status_code=204)
def delete_order(number: str, db: DB, _: AdminUser):
    order = db.scalar(select(Order).where(Order.number == number.upper()))
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status not in (OrderStatus.pending_payment, OrderStatus.cancelled):
        raise HTTPException(409, "Only unpaid or cancelled orders can be deleted")
    db.delete(order)
    db.commit()


# ── Reviews ──
class AdminReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    author_name: str
    rating: int
    title: str
    body: str
    verified: bool
    created_at: datetime
    product_name: str
    product_slug: str


@router.get("/reviews", response_model=list[AdminReviewOut])
def list_reviews(db: DB, _: AdminUser):
    rows = db.execute(select(Review, Product.name, Product.slug).join(Product)
                      .order_by(Review.created_at.desc()).limit(500)).all()
    return [AdminReviewOut(**{c: getattr(r, c) for c in ("id", "author_name", "rating", "title", "body", "verified",
                                                          "created_at")}, product_name=n, product_slug=sl)
            for r, n, sl in rows]


# ── Requests & messages ──
class RequestStatus(BaseModel):
    status: Literal["received", "quoted", "in_progress", "completed", "rejected"]


class AdminImportOut(ImportRequestOut):
    id: int
    full_name: str
    phone: str
    email: str
    item_url: str
    item_description: str


class AdminTradeInOut(TradeInOut):
    id: int
    full_name: str
    phone: str
    email: str
    category: str
    brand: str
    model: str
    storage: str
    condition: str


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: str
    subject: str
    message: str
    created_at: datetime


class SubscriberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    created_at: datetime


class AdminUserOut(UserOut):
    created_at: datetime
    order_count: int = 0


SIMPLE = {"imports": ImportRequest, "trade-ins": TradeIn, "messages": ContactMessage, "subscribers": NewsletterSubscriber}


@router.get("/imports", response_model=list[AdminImportOut])
def list_imports(db: DB, _: AdminUser):
    return db.scalars(select(ImportRequest).order_by(ImportRequest.created_at.desc())).all()


@router.get("/trade-ins", response_model=list[AdminTradeInOut])
def list_trade_ins(db: DB, _: AdminUser):
    return db.scalars(select(TradeIn).order_by(TradeIn.created_at.desc())).all()


@router.get("/messages", response_model=list[ContactOut])
def list_messages(db: DB, _: AdminUser):
    return db.scalars(select(ContactMessage).order_by(ContactMessage.created_at.desc())).all()


@router.get("/subscribers", response_model=list[SubscriberOut])
def list_subscribers(db: DB, _: AdminUser):
    return db.scalars(select(NewsletterSubscriber).order_by(NewsletterSubscriber.created_at.desc())).all()


# ── Customers ──
@router.get("/users", response_model=list[AdminUserOut])
def list_users(db: DB, _: AdminUser):
    counts = dict(db.execute(select(Order.user_id, func.count(Order.id)).group_by(Order.user_id)).all())
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [AdminUserOut.model_validate(u).model_copy(update={"order_count": counts.get(u.id, 0)}) for u in users]


class AdminUserCreate(UserCreate):
    is_admin: bool = False


@router.post("/users", response_model=AdminUserOut, status_code=201)
def create_user(data: AdminUserCreate, db: DB, _: AdminUser):
    email = data.email.lower()
    if db.scalar(select(User.id).where(func.lower(User.email) == email)):
        raise HTTPException(409, "An account with this email already exists")
    user = User(email=email, full_name=data.full_name, phone=data.phone,
                hashed_password=hash_password(data.password), is_admin=data.is_admin)
    db.add(user)
    db.commit()
    return AdminUserOut.model_validate(user)


@router.patch("/users/{user_id}/admin", response_model=AdminUserOut)
def toggle_admin(user_id: int, db: DB, admin: AdminUser):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if user.id == admin.id:
        raise HTTPException(409, "You can't change your own admin access")
    user.is_admin = not user.is_admin
    db.commit()
    return AdminUserOut.model_validate(user).model_copy(
        update={"order_count": db.scalar(select(func.count(Order.id)).where(Order.user_id == user.id))})


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: DB, admin: AdminUser):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if user.id == admin.id:
        raise HTTPException(409, "You can't delete your own account")
    # Keep their orders (needed for accounting) but detach them from the account.
    for order in db.scalars(select(Order).where(Order.user_id == user.id)):
        order.user_id = None
    for review in db.scalars(select(Review).where(Review.user_id == user.id)):
        review.user_id = None
    db.delete(user)
    db.commit()


# Generic routes last so they don't shadow the specific ones above.
@router.patch("/{kind}/{item_id}/status", status_code=204)
def set_request_status(kind: Literal["imports", "trade-ins"], item_id: int, data: RequestStatus, db: DB, _: AdminUser):
    item = db.get(SIMPLE[kind], item_id)
    if not item:
        raise HTTPException(404, "Not found")
    item.status = data.status
    db.commit()


@router.delete("/{kind}/{item_id}", status_code=204)
def delete_simple(kind: Literal["imports", "trade-ins", "messages", "subscribers"], item_id: int, db: DB, _: AdminUser):
    item = db.get(SIMPLE[kind], item_id)
    if not item:
        raise HTTPException(404, "Not found")
    db.delete(item)
    db.commit()
