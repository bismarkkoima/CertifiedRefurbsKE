from fastapi import APIRouter

from app.api.deps import DB
from app.db.models import ImportRequest
from app.schemas import ImportQuoteIn, ImportQuoteOut, ImportRequestIn, ImportRequestOut
from app.services.orders import reference
from app.services.pricing import import_quote

router = APIRouter()


@router.post("/quote", response_model=ImportQuoteOut)
def quote(data: ImportQuoteIn):
    return import_quote(data.item_price_usd, data.category, data.shipping_usd)


@router.post("/requests", response_model=ImportRequestOut, status_code=201)
def create_request(data: ImportRequestIn, db: DB):
    req = ImportRequest(
        reference=reference("IMP"),
        full_name=data.full_name,
        phone=data.phone,
        email=data.email,
        item_url=data.item_url,
        item_description=data.item_description,
        category=data.category,
        item_price_usd=data.item_price_usd,
        quote=import_quote(data.item_price_usd, data.category, data.shipping_usd),
    )
    db.add(req)
    db.commit()
    return req
