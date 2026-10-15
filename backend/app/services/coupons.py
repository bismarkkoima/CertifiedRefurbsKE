from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Coupon


def evaluate(db: Session, code: str, subtotal: int) -> tuple[Coupon, int]:
    """Validate a coupon against a subtotal and return it with the discount it gives."""
    coupon = db.scalar(select(Coupon).where(func.upper(Coupon.code) == code.strip().upper()))
    if not coupon or not coupon.active:
        raise HTTPException(400, "That promo code isn't valid")
    expires = coupon.expires_at
    if expires and (expires if expires.tzinfo else expires.replace(tzinfo=timezone.utc)) < datetime.now(timezone.utc):
        raise HTTPException(400, "That promo code has expired")
    if coupon.max_uses is not None and coupon.uses >= coupon.max_uses:
        raise HTTPException(400, "That promo code has been fully redeemed")
    if subtotal < coupon.min_subtotal:
        raise HTTPException(400, f"Spend KSh {coupon.min_subtotal:,} or more to use {coupon.code}")
    discount = coupon.amount_off + subtotal * coupon.percent_off // 100
    if coupon.max_discount is not None:
        discount = min(discount, coupon.max_discount)
    return coupon, min(discount, subtotal)
