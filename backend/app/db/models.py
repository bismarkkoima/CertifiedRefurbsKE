import enum
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Grade(str, enum.Enum):
    excellent = "excellent"
    good = "good"
    fair = "fair"


class OrderStatus(str, enum.Enum):
    pending_payment = "pending_payment"
    paid = "paid"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"


class EscrowStatus(str, enum.Enum):
    awaiting_funds = "awaiting_funds"
    held = "held"
    released = "released"
    refunded = "refunded"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(20))
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    orders: Mapped[list["Order"]] = relationship(back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    brand: Mapped[str] = mapped_column(String(60), index=True)
    category: Mapped[str] = mapped_column(String(40), index=True)
    year: Mapped[int] = mapped_column(Integer, default=2023)
    tagline: Mapped[str] = mapped_column(String(160), default="")
    subtitle: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    specs: Mapped[dict] = mapped_column(JSON, default=dict)
    colors: Mapped[list] = mapped_column(JSON, default=list)
    image_url: Mapped[str | None] = mapped_column(String(500))
    new_price: Mapped[int] = mapped_column(Integer)
    # Denormalised from real customer reviews.
    rating: Mapped[float] = mapped_column(Float, default=0)
    reviews_count: Mapped[int] = mapped_column(Integer, default=0)
    warranty_months: Mapped[int] = mapped_column(Integer, default=6)
    hue: Mapped[int] = mapped_column(Integer, default=220)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    # Archived products are hidden from the store but kept for order history.
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    deal: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    variants: Mapped[list["ProductVariant"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="ProductVariant.id"
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="Review.created_at.desc()"
    )


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    grade: Mapped[Grade] = mapped_column(Enum(Grade))
    storage: Mapped[str] = mapped_column(String(40), index=True)
    price: Mapped[int] = mapped_column(Integer)
    new_price: Mapped[int] = mapped_column(Integer)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    battery_health: Mapped[int] = mapped_column(Integer, default=90)

    product: Mapped[Product] = relationship(back_populates="variants")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    customer_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20))
    email: Mapped[str] = mapped_column(String(255))
    address: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(80))
    delivery_method: Mapped[str] = mapped_column(String(30), default="nairobi")
    subtotal: Mapped[int] = mapped_column(Integer)
    coupon_code: Mapped[str | None] = mapped_column(String(30))
    discount: Mapped[int] = mapped_column(Integer, default=0)
    delivery_fee: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.pending_payment)
    escrow_status: Mapped[EscrowStatus] = mapped_column(Enum(EscrowStatus), default=EscrowStatus.awaiting_funds)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped[User | None] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    events: Mapped[list["OrderEvent"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderEvent.created_at"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    variant_id: Mapped[int] = mapped_column(ForeignKey("product_variants.id"))
    product_name: Mapped[str] = mapped_column(String(160))
    product_slug: Mapped[str] = mapped_column(String(160))
    grade: Mapped[Grade] = mapped_column(Enum(Grade))
    storage: Mapped[str] = mapped_column(String(40), default="")
    color: Mapped[str] = mapped_column(String(60), default="")
    unit_price: Mapped[int] = mapped_column(Integer)
    quantity: Mapped[int] = mapped_column(Integer, default=1)

    order: Mapped[Order] = relationship(back_populates="items")


class OrderEvent(Base):
    __tablename__ = "order_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    detail: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    order: Mapped[Order] = relationship(back_populates="events")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    phone: Mapped[str] = mapped_column(String(20))
    amount: Mapped[int] = mapped_column(Integer)
    merchant_request_id: Mapped[str] = mapped_column(String(80), default="")
    checkout_request_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.pending)
    mpesa_receipt: Mapped[str | None] = mapped_column(String(40))
    result_desc: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    order: Mapped[Order] = relationship(back_populates="payments")


class ImportRequest(Base):
    __tablename__ = "import_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20))
    email: Mapped[str] = mapped_column(String(255))
    item_url: Mapped[str] = mapped_column(String(500), default="")
    item_description: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(40))
    item_price_usd: Mapped[float] = mapped_column(Float)
    quote: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(30), default="received")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class TradeIn(Base):
    __tablename__ = "trade_ins"

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20))
    email: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(40))
    brand: Mapped[str] = mapped_column(String(60))
    model: Mapped[str] = mapped_column(String(120))
    storage: Mapped[str] = mapped_column(String(40))
    condition: Mapped[str] = mapped_column(String(30))
    quoted_price: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(30), default="received")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    author_name: Mapped[str] = mapped_column(String(80))
    rating: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(120))
    body: Mapped[str] = mapped_column(Text)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product: Mapped[Product] = relationship(back_populates="reviews")


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(160), default="")
    percent_off: Mapped[int] = mapped_column(Integer, default=0)
    amount_off: Mapped[int] = mapped_column(Integer, default=0)
    max_discount: Mapped[int | None] = mapped_column(Integer)
    min_subtotal: Mapped[int] = mapped_column(Integer, default=0)
    max_uses: Mapped[int | None] = mapped_column(Integer)
    uses: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(160))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
