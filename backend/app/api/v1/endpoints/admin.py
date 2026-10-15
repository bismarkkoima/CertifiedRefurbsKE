from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, AdminUser
from app.api.v1.endpoints.listings import detail
from app.db.models import (Coupon, EscrowStatus, Grade, ImportRequest, Order, OrderStatus, Product, ProductVariant,
                           Review, TradeIn, User)
from app.db.seed import product_slug
from app.schemas import (AdminProductCreate, AdminProductUpdate, AdminStats, AdminVariantUpdate, OrderOut,
                         ProductDetail)
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
