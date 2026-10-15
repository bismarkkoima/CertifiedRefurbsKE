import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Coupon, EscrowStatus, Order, OrderEvent, OrderStatus, Payment, PaymentStatus, ProductVariant


def reference(prefix: str) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return f"{prefix}-" + "".join(secrets.choice(alphabet) for _ in range(7))


def phone_matches(a: str, b: str) -> bool:
    return re.sub(r"\D", "", a)[-9:] == re.sub(r"\D", "", b)[-9:]


def add_event(order: Order, title: str, detail: str = "") -> None:
    order.events.append(OrderEvent(title=title, detail=detail))


def apply_payment_result(db: Session, payment: Payment, status: str, desc: str, receipt: str | None) -> None:
    """Idempotently record an M-Pesa result and move the order into escrow."""
    if payment.status != PaymentStatus.pending:
        return
    payment.result_desc = desc
    order = payment.order
    if status == "success":
        payment.status = PaymentStatus.success
        payment.mpesa_receipt = receipt
        if order.status == OrderStatus.pending_payment:
            order.status = OrderStatus.paid
            order.escrow_status = EscrowStatus.held
            if order.coupon_code:
                coupon = db.scalar(select(Coupon).where(Coupon.code == order.coupon_code))
                if coupon:
                    coupon.uses += 1
            for item in order.items:
                variant = db.get(ProductVariant, item.variant_id)
                if variant:
                    variant.stock = max(variant.stock - item.quantity, 0)
            add_event(order, "Payment received", f"M-Pesa receipt {receipt or '—'} · KSh {order.total:,}")
            add_event(order, "Funds held in escrow",
                      "Your money is protected and only released once you confirm delivery.")
    elif status == "failed":
        payment.status = PaymentStatus.failed
        add_event(order, "Payment not completed", desc)
    db.commit()
