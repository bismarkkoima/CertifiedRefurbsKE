from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Category = Literal["phones", "laptops", "tablets", "accessories"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ── Auth ──
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    phone: str | None = None
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORM):
    id: int
    email: str
    full_name: str
    phone: str | None
    is_admin: bool


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Catalogue ──
class VariantOut(ORM):
    id: int
    grade: str
    price: int
    stock: int
    battery_health: int


class ProductSummary(ORM):
    id: int
    slug: str
    name: str
    brand: str
    category: str
    storage: str
    color: str
    subtitle: str
    new_price: int
    rating: float
    reviews_count: int
    hue: int
    featured: bool
    deal: bool
    price_from: int
    best_grade: str
    in_stock: bool


class ProductDetail(ProductSummary):
    description: str
    specs: dict
    warranty_months: int
    variants: list[VariantOut]


class Facet(BaseModel):
    value: str
    count: int


class ProductPage(BaseModel):
    items: list[ProductSummary]
    total: int
    page: int
    pages: int
    facets: dict[str, list[Facet]]


# ── Orders ──
class CartItemIn(BaseModel):
    variant_id: int
    quantity: int = Field(default=1, ge=1, le=5)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=9, max_length=20)
    email: EmailStr
    address: str = Field(min_length=3, max_length=255)
    city: str = Field(min_length=2, max_length=80)
    delivery_method: Literal["nairobi", "countrywide", "pickup"] = "nairobi"
    items: list[CartItemIn] = Field(min_length=1, max_length=20)


class OrderItemOut(ORM):
    product_name: str
    product_slug: str
    grade: str
    unit_price: int
    quantity: int


class OrderEventOut(ORM):
    title: str
    detail: str
    created_at: datetime


class OrderOut(ORM):
    number: str
    customer_name: str
    phone: str
    email: str
    address: str
    city: str
    delivery_method: str
    subtotal: int
    delivery_fee: int
    total: int
    status: str
    escrow_status: str
    created_at: datetime
    items: list[OrderItemOut]
    events: list[OrderEventOut]


# ── Payments ──
class StkPushIn(BaseModel):
    order_number: str
    phone: str


class PaymentOut(ORM):
    checkout_request_id: str
    status: str
    amount: int
    mpesa_receipt: str | None
    result_desc: str
    order_number: str
    order_status: str
    simulated: bool = False


# ── Imports ──
class ImportQuoteIn(BaseModel):
    item_price_usd: float = Field(gt=0, le=20000)
    category: Category = "phones"
    shipping_usd: float = Field(default=0, ge=0, le=2000)


class QuoteLine(BaseModel):
    label: str
    amount: int


class ImportQuoteOut(BaseModel):
    category: str
    category_label: str
    exchange_rate: float
    item_price_usd: float
    lines: list[QuoteLine]
    cif_value: int
    total_taxes: int
    total: int
    eta_days: str


class ImportRequestIn(ImportQuoteIn):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=9, max_length=20)
    email: EmailStr
    item_url: str = Field(default="", max_length=500)
    item_description: str = Field(min_length=2, max_length=255)


class ImportRequestOut(ORM):
    reference: str
    status: str
    quote: ImportQuoteOut
    created_at: datetime


# ── Trade-ins ──
TradeCondition = Literal["like_new", "good", "worn", "broken"]


class TradeInQuoteIn(BaseModel):
    category: Category
    brand: str = Field(min_length=1, max_length=60)
    model: str = Field(min_length=1, max_length=120)
    storage: str = Field(default="128GB", max_length=40)
    condition: TradeCondition


class TradeInQuoteOut(BaseModel):
    quoted_price: int
    valid_days: int = 7


class TradeInIn(TradeInQuoteIn):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=9, max_length=20)
    email: EmailStr


class TradeInOut(ORM):
    reference: str
    quoted_price: int
    status: str
    created_at: datetime


# ── Misc ──
class NewsletterIn(BaseModel):
    email: EmailStr


class ContactIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    subject: str = Field(min_length=2, max_length=160)
    message: str = Field(min_length=5, max_length=4000)


class MessageOut(BaseModel):
    message: str


class AdminStats(BaseModel):
    revenue: int
    orders: int
    paid_orders: int
    pending_orders: int
    products: int
    units_in_stock: int
    customers: int
    import_requests: int
    trade_ins: int
    recent_orders: list[OrderOut]
