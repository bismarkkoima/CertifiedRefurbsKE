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
    storage: str
    price: int
    new_price: int
    stock: int
    battery_health: int


class Colour(BaseModel):
    name: str
    hex: str


class ProductSummary(ORM):
    id: int
    slug: str
    name: str
    brand: str
    category: str
    year: int
    tagline: str
    subtitle: str
    colors: list[Colour]
    storages: list[str]
    image_url: str | None
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
    color: str = Field(default="", max_length=60)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=9, max_length=20)
    email: EmailStr
    address: str = Field(min_length=3, max_length=255)
    city: str = Field(min_length=2, max_length=80)
    delivery_method: Literal["nairobi", "countrywide", "pickup"] = "nairobi"
    coupon_code: str | None = Field(default=None, max_length=30)
    items: list[CartItemIn] = Field(min_length=1, max_length=20)


class OrderItemOut(ORM):
    product_name: str
    product_slug: str
    grade: str
    storage: str
    color: str
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
    coupon_code: str | None
    discount: int
    delivery_fee: int
    total: int
    status: str
    escrow_status: str
    created_at: datetime
    items: list[OrderItemOut]
    events: list[OrderEventOut]


# ── Coupons ──
class CouponCheckIn(BaseModel):
    code: str = Field(min_length=2, max_length=30)
    subtotal: int = Field(ge=0)


class CouponCheckOut(BaseModel):
    code: str
    description: str
    discount: int


# ── Reviews ──
class ReviewIn(BaseModel):
    author_name: str = Field(min_length=2, max_length=80)
    rating: int = Field(ge=1, le=5)
    title: str = Field(min_length=2, max_length=120)
    body: str = Field(min_length=10, max_length=3000)


class ReviewOut(ORM):
    id: int
    author_name: str
    rating: int
    title: str
    body: str
    verified: bool
    created_at: datetime


class ReviewPage(BaseModel):
    items: list[ReviewOut]
    average: float
    count: int
    distribution: dict[int, int]


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


class AdminVariantUpdate(BaseModel):
    price: int | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)


class AdminProductUpdate(BaseModel):
    featured: bool | None = None
    deal: bool | None = None
    tagline: str | None = Field(default=None, max_length=160)
    image_url: str | None = Field(default=None, max_length=500)


class AdminProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    brand: str = Field(min_length=1, max_length=60)
    category: Category
    year: int = Field(ge=2010, le=2100)
    tagline: str = Field(default="", max_length=160)
    subtitle: str = Field(min_length=2, max_length=160)
    description: str = Field(min_length=10)
    specs: dict[str, str] = Field(default_factory=dict)
    colors: list[Colour] = Field(min_length=1)
    storages: list[str] = Field(min_length=1)
    price: int = Field(gt=0, description="Excellent-grade price of the base storage tier")
    new_price: int = Field(gt=0)
    image_url: str | None = None
    stock: int = Field(default=0, ge=0, description="Starting stock for each variant")


class AdminProductOut(ProductDetail):
    pass


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
