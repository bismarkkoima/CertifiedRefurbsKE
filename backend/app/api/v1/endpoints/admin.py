from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, AdminUser
from app.db.models import (EscrowStatus, ImportRequest, Order, OrderStatus, Product, ProductVariant,
                           TradeIn, User)
from app.schemas import AdminStats, OrderOut
from app.services.orders import add_event

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
