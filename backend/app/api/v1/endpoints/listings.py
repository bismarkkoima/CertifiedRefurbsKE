import math
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import Select, case, distinct, func, or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, OptionalUser
from app.db.models import Grade, Order, OrderItem, OrderStatus, Product, ProductVariant, Review
from app.schemas import Facet, ProductDetail, ProductPage, ProductSummary, ReviewIn, ReviewOut, ReviewPage

router = APIRouter()

SortKey = Literal["featured", "price_asc", "price_desc", "rating", "newest", "discount"]


class BrandOut(BaseModel):
    name: str
    count: int
    categories: list[str]
    price_from: int


def _csv(value: str | None) -> list[str]:
    return [v.strip() for v in value.split(",") if v.strip()] if value else []


def summarize(product: Product, grade: str | None = None, storages: list[str] | None = None) -> dict:
    variants = [v for v in product.variants
                if (grade is None or v.grade.value == grade) and (not storages or v.storage in storages)]
    available = [v for v in variants if v.stock > 0] or variants
    cheapest = min(available, key=lambda v: v.price) if available else None
    return {
        **{c: getattr(product, c) for c in ProductSummary.model_fields if hasattr(product, c)},
        "storages": list(dict.fromkeys(v.storage for v in product.variants)),
        "new_price": cheapest.new_price if cheapest else product.new_price,
        "price_from": cheapest.price if cheapest else 0,
        "best_grade": cheapest.grade.value if cheapest else "good",
        "in_stock": any(v.stock > 0 for v in product.variants),
    }


def detail(product: Product) -> ProductDetail:
    return ProductDetail(
        **summarize(product),
        description=product.description,
        specs=product.specs,
        warranty_months=product.warranty_months,
        variants=product.variants,
    )


def _base_query(q: str | None, category: str | None) -> Select:
    stmt = select(Product)
    if category:
        stmt = stmt.where(Product.category == category)
    if q:
        for term in q.split():
            like = f"%{term}%"
            stmt = stmt.where(or_(Product.name.ilike(like), Product.brand.ilike(like), Product.subtitle.ilike(like),
                                  Product.category.ilike(like), Product.tagline.ilike(like)))
    return stmt


def _facet(db, stmt: Select, column) -> list[Facet]:
    sub = stmt.subquery()
    rows = db.execute(select(sub.c[column], func.count()).group_by(sub.c[column])
                      .order_by(func.count().desc(), sub.c[column]))
    return [Facet(value=str(v), count=c) for v, c in rows]


def _storage_facet(db, stmt: Select) -> list[Facet]:
    ids = stmt.with_only_columns(Product.id).subquery()
    rows = db.execute(
        select(ProductVariant.storage, func.count(distinct(ProductVariant.product_id)))
        .where(ProductVariant.product_id.in_(select(ids.c.id)))
        .group_by(ProductVariant.storage)
    ).all()
    order = lambda s: (0, float(s[:-2]) * (1024 if s.endswith("TB") else 1)) if s[:-2].isdigit() else (1, 0)  # noqa: E731
    return [Facet(value=v, count=c) for v, c in sorted(rows, key=lambda r: order(r[0]))]


@router.get("", response_model=ProductPage)
def list_products(
    db: DB,
    q: str | None = Query(None, max_length=80),
    category: str | None = None,
    brand: str | None = Query(None, description="Comma separated brands"),
    storage: str | None = Query(None, description="Comma separated storage sizes"),
    grade: Grade | None = None,
    min_price: int | None = Query(None, ge=0),
    max_price: int | None = Query(None, ge=0),
    deal: bool | None = None,
    featured: bool | None = None,
    sort: SortKey = "featured",
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=60),
):
    base = _base_query(q, category)
    facets = {
        "brand": _facet(db, base, "brand"),
        "storage": _storage_facet(db, base),
        "category": _facet(db, _base_query(q, None), "category"),
    }

    storages = _csv(storage)
    # Cheapest in-stock variant, falling back to the cheapest overall when everything is sold out.
    in_stock_min = func.min(case((ProductVariant.stock > 0, ProductVariant.price)))
    price_q = select(ProductVariant.product_id,
                     func.coalesce(in_stock_min, func.min(ProductVariant.price)).label("price_from"))
    if grade:
        price_q = price_q.where(ProductVariant.grade == grade)
    if storages:
        price_q = price_q.where(ProductVariant.storage.in_(storages))
    price_sub = price_q.group_by(ProductVariant.product_id).subquery()

    stmt = base.join(price_sub, price_sub.c.product_id == Product.id)
    if brands := _csv(brand):
        stmt = stmt.where(Product.brand.in_(brands))
    if min_price is not None:
        stmt = stmt.where(price_sub.c.price_from >= min_price)
    if max_price is not None:
        stmt = stmt.where(price_sub.c.price_from <= max_price)
    if deal is not None:
        stmt = stmt.where(Product.deal == deal)
    if featured is not None:
        stmt = stmt.where(Product.featured == featured)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    order = {
        "featured": (Product.featured.desc(), Product.year.desc(), Product.new_price.desc()),
        "price_asc": (price_sub.c.price_from.asc(),),
        "price_desc": (price_sub.c.price_from.desc(),),
        "rating": (Product.rating.desc(), Product.reviews_count.desc(), Product.year.desc()),
        "newest": (Product.year.desc(), Product.new_price.desc()),
        "discount": ((price_sub.c.price_from * 1.0 / Product.new_price).asc(),),
    }[sort]
    stmt = stmt.options(selectinload(Product.variants)).order_by(*order, Product.id)
    products = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()

    return ProductPage(
        items=[ProductSummary(**summarize(p, grade.value if grade else None, storages)) for p in products],
        total=total,
        page=page,
        pages=max(1, math.ceil(total / page_size)),
        facets=facets,
    )


@router.get("/brands", response_model=list[BrandOut])
def brands(db: DB):
    rows = db.execute(
        select(Product.brand, Product.category, func.count(distinct(Product.id)), func.min(ProductVariant.price))
        .join(ProductVariant, ProductVariant.product_id == Product.id)
        .group_by(Product.brand, Product.category)
    ).all()
    out: dict[str, BrandOut] = {}
    for name, category, count, price in rows:
        b = out.setdefault(name, BrandOut(name=name, count=0, categories=[], price_from=price))
        b.count += count
        b.categories.append(category)
        b.price_from = min(b.price_from, price)
    return sorted(out.values(), key=lambda b: -b.count)


def _get(db, slug: str, *options) -> Product:
    product = db.scalar(select(Product).where(Product.slug == slug).options(*options))
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@router.get("/{slug}", response_model=ProductDetail)
def get_product(slug: str, db: DB):
    return detail(_get(db, slug, selectinload(Product.variants)))


@router.get("/{slug}/related", response_model=list[ProductSummary])
def related_products(slug: str, db: DB, limit: int = Query(4, ge=1, le=12)):
    product = _get(db, slug)
    stmt = (
        select(Product)
        .where(Product.category == product.category, Product.id != product.id)
        .options(selectinload(Product.variants))
        .order_by((Product.brand == product.brand).desc(), func.abs(Product.new_price - product.new_price))
        .limit(limit)
    )
    return [ProductSummary(**summarize(p)) for p in db.scalars(stmt)]


@router.get("/{slug}/reviews", response_model=ReviewPage)
def list_reviews(slug: str, db: DB):
    product = _get(db, slug, selectinload(Product.reviews))
    distribution = {star: 0 for star in range(5, 0, -1)}
    for r in product.reviews:
        distribution[r.rating] += 1
    return ReviewPage(items=product.reviews[:50], average=product.rating,
                      count=product.reviews_count, distribution=distribution)


@router.post("/{slug}/reviews", response_model=ReviewOut, status_code=201)
def create_review(slug: str, data: ReviewIn, db: DB, user: OptionalUser):
    product = _get(db, slug)
    verified = bool(user and db.scalar(
        select(Order.id).join(OrderItem)
        .where(Order.user_id == user.id, OrderItem.product_slug == slug,
               Order.status.in_((OrderStatus.delivered, OrderStatus.completed)))
        .limit(1)
    ))
    review = Review(product_id=product.id, user_id=user.id if user else None, verified=verified, **data.model_dump())
    db.add(review)
    db.flush()
    count, avg = db.execute(
        select(func.count(Review.id), func.avg(Review.rating)).where(Review.product_id == product.id)
    ).one()
    product.reviews_count = count
    product.rating = round(float(avg), 1)
    db.commit()
    return review
