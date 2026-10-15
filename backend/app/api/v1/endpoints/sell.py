from fastapi import APIRouter

from app.api.deps import DB
from app.db.models import TradeIn
from app.schemas import TradeInIn, TradeInOut, TradeInQuoteIn, TradeInQuoteOut
from app.services.orders import reference
from app.services.pricing import trade_in_quote

router = APIRouter()


@router.post("/quote", response_model=TradeInQuoteOut)
def quote(data: TradeInQuoteIn):
    return TradeInQuoteOut(quoted_price=trade_in_quote(data.category, data.brand, data.model, data.storage, data.condition))


@router.post("/requests", response_model=TradeInOut, status_code=201)
def create_trade_in(data: TradeInIn, db: DB):
    trade_in = TradeIn(
        reference=reference("SEL"),
        full_name=data.full_name,
        phone=data.phone,
        email=data.email,
        category=data.category,
        brand=data.brand,
        model=data.model,
        storage=data.storage,
        condition=data.condition,
        quoted_price=trade_in_quote(data.category, data.brand, data.model, data.storage, data.condition),
    )
    db.add(trade_in)
    db.commit()
    return trade_in
