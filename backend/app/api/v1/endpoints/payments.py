from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select

from app.api.deps import DB
from app.db.models import Order, OrderStatus, Payment, PaymentStatus
from app.schemas import PaymentOut, StkPushIn
from app.services.mpesa.daraja_client import DarajaClient, MpesaError, daraja, normalize_phone
from app.services.orders import apply_payment_result

router = APIRouter()


def _out(payment: Payment) -> PaymentOut:
    return PaymentOut(
        checkout_request_id=payment.checkout_request_id,
        status=payment.status.value,
        amount=payment.amount,
        mpesa_receipt=payment.mpesa_receipt,
        result_desc=payment.result_desc,
        order_number=payment.order.number,
        order_status=payment.order.status.value,
        simulated=daraja.simulated,
    )


@router.post("/mpesa/stkpush", response_model=PaymentOut, status_code=201)
def stk_push(data: StkPushIn, db: DB):
    order = db.scalar(select(Order).where(Order.number == data.order_number.upper()))
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status != OrderStatus.pending_payment:
        raise HTTPException(409, "This order has already been paid")
    try:
        phone = normalize_phone(data.phone)
        result = daraja.stk_push(phone, order.total, order.number, "CertRefurbs")
    except MpesaError as exc:
        raise HTTPException(400, str(exc)) from exc
    payment = Payment(
        order_id=order.id,
        phone=phone,
        amount=order.total,
        merchant_request_id=result.merchant_request_id,
        checkout_request_id=result.checkout_request_id,
        result_desc=result.customer_message,
    )
    db.add(payment)
    db.commit()
    return _out(payment)


@router.get("/{checkout_request_id}", response_model=PaymentOut)
def payment_status(checkout_request_id: str, db: DB):
    payment = db.scalar(select(Payment).where(Payment.checkout_request_id == checkout_request_id))
    if not payment:
        raise HTTPException(404, "Payment not found")
    if payment.status == PaymentStatus.pending:
        try:
            result = daraja.stk_query(checkout_request_id)
        except (MpesaError, Exception):  # network hiccups leave the payment pending
            result = None
        if result and result.status != "pending":
            apply_payment_result(db, payment, result.status, result.result_desc, result.receipt)
    return _out(payment)


@router.post("/mpesa/callback")
async def mpesa_callback(request: Request, db: DB):
    """Daraja posts the STK result here. Always acknowledge so Safaricom stops retrying."""
    try:
        checkout_id, result = DarajaClient.parse_callback(await request.json())
    except (KeyError, ValueError, TypeError):
        return {"ResultCode": 0, "ResultDesc": "Ignored"}
    payment = db.scalar(select(Payment).where(Payment.checkout_request_id == checkout_id))
    if payment:
        apply_payment_result(db, payment, result.status, result.result_desc, result.receipt)
    return {"ResultCode": 0, "ResultDesc": "Accepted"}
