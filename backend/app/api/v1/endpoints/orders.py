from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, CurrentUser, OptionalUser
from app.db.models import EscrowStatus, Order, OrderItem, OrderStatus, ProductVariant
from app.schemas import OrderCreate, OrderOut
from app.services.orders import add_event, phone_matches, reference
from app.services.pricing import delivery_fee

router = APIRouter()


def _load(db, number: str) -> Order:
    order = db.scalar(
        select(Order).where(Order.number == number.upper())
        .options(selectinload(Order.items), selectinload(Order.events))
    )
    if not order:
        raise HTTPException(404, "Order not found")
    return order


def _authorize(order: Order, user, phone: str | None) -> None:
    if user and (user.is_admin or order.user_id == user.id):
        return
    if phone and phone_matches(phone, order.phone):
        return
    raise HTTPException(404, "Order not found")


@router.post("", response_model=OrderOut, status_code=201)
def create_order(data: OrderCreate, db: DB, user: OptionalUser):
    order = Order(
        number=reference("CRK"),
        user_id=user.id if user else None,
        customer_name=data.customer_name,
        phone=data.phone,
        email=data.email,
        address=data.address,
        city=data.city,
        delivery_method=data.delivery_method,
        subtotal=0,
        delivery_fee=0,
        total=0,
    )
    subtotal = 0
    for line in data.items:
        variant = db.get(ProductVariant, line.variant_id)
        if not variant:
            raise HTTPException(400, f"Item {line.variant_id} is no longer available")
        if variant.stock < line.quantity:
            raise HTTPException(409, f"Only {variant.stock} left of {variant.product.name} ({variant.grade.value})")
        subtotal += variant.price * line.quantity
        order.items.append(OrderItem(
            variant_id=variant.id,
            product_name=variant.product.name,
            product_slug=variant.product.slug,
            grade=variant.grade,
            unit_price=variant.price,
            quantity=line.quantity,
        ))
    order.subtotal = subtotal
    order.delivery_fee = delivery_fee(subtotal, data.delivery_method)
    order.total = subtotal + order.delivery_fee
    add_event(order, "Order placed", f"{sum(i.quantity for i in order.items)} item(s) · awaiting M-Pesa payment")
    db.add(order)
    db.commit()
    return _load(db, order.number)


@router.get("/mine", response_model=list[OrderOut])
def my_orders(db: DB, user: CurrentUser):
    stmt = (
        select(Order).where(Order.user_id == user.id)
        .options(selectinload(Order.items), selectinload(Order.events))
        .order_by(Order.created_at.desc())
    )
    return db.scalars(stmt).all()


@router.get("/{number}", response_model=OrderOut)
def get_order(number: str, db: DB, user: OptionalUser, phone: str | None = Query(None)):
    order = _load(db, number)
    _authorize(order, user, phone)
    return order


@router.post("/{number}/confirm-delivery", response_model=OrderOut)
def confirm_delivery(number: str, db: DB, user: OptionalUser, phone: str | None = Query(None)):
    order = _load(db, number)
    _authorize(order, user, phone)
    if order.escrow_status != EscrowStatus.held or order.status not in (OrderStatus.shipped, OrderStatus.delivered):
        raise HTTPException(409, "Delivery can be confirmed once your order has been shipped")
    order.status = OrderStatus.completed
    order.escrow_status = EscrowStatus.released
    add_event(order, "Delivery confirmed", "Thanks! Escrow funds have been released to the seller.")
    db.commit()
    return _load(db, number)
