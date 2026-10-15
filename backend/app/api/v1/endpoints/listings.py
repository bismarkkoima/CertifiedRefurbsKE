import math
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DB
from app.db.models import Grade, Product, ProductVariant
from app.schemas import Facet, ProductDetail, ProductPage, ProductSummary

router = APIRouter()

SortKey = Literal["featured", "price_asc", "price_desc", "rating", "newest", "discount"]


def _csv(value: str | None) -> list[str]:
    return [v.strip() for v in value.split(",") if v.strip()] if value else []


def summarize(product: Product, grade: str | None = None) -> dict:
    variants = [v for v in product.variants if grade is None or v.grade.value == grade]
    available = [v for v in variants if v.stock > 0] or variants
    cheapest = min(available, key=lambda v: v.price) if available else None
    return {
        **{c: getattr(product, c) for c in ProductSummary.model_fields if hasattr(product, c)},
        "price_from": cheapest.price if cheapest else 0,
        "best_grade": cheapest.grade.value if cheapest else "good",
        "in_stock": any(v.stock > 0 for v in product.variants),
    }


def _base_query(q: str | None, category: str | None) -> Select:
    stmt = select(Product)
    if category:
        stmt = stmt.where(Product.category == category)
    if q:
        for term in q.split():
            like = f"%{term}%"
            stmt = stmt.where(or_(Product.name.ilike(like), Product.brand.ilike(like),
                                  Product.subtitle.ilike(like), Product.category.ilike(like)))
    return stmt


def _facet(db, stmt: Select, column) -> list[Facet]:
    sub = stmt.subquery()
    rows = db.execute(select(sub.c[column], func.count()).group_by(sub.c[column]).order_by(func.count().desc()))
    return [Facet(value=str(v), count=c) for v, c in rows]


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
    page_size: int = Query(12, ge=1, le=48),
):
    base = _base_query(q, category)
    facets = {
        "brand": _facet(db, base, "brand"),
        "storage": _facet(db, base, "storage"),
        "category": _facet(db, _base_query(q, None), "category"),
    }

    price_q = select(ProductVariant.product_id, func.min(ProductVariant.price).label("price_from"))
    if grade:
        price_q = price_q.where(ProductVariant.grade == grade)
    price_sub = price_q.group_by(ProductVariant.product_id).subquery()

    stmt = base.join(price_sub, price_sub.c.product_id == Product.id)
    if brands := _csv(brand):
        stmt = stmt.where(Product.brand.in_(brands))
    if storages := _csv(storage):
        stmt = stmt.where(Product.storage.in_(storages))
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
        "featured": (Product.featured.desc(), Product.reviews_count.desc()),
        "price_asc": (price_sub.c.price_from.asc(),),
        "price_desc": (price_sub.c.price_from.desc(),),
        "rating": (Product.rating.desc(), Product.reviews_count.desc()),
        "newest": (Product.created_at.desc(), Product.id.desc()),
        "discount": ((price_sub.c.price_from * 1.0 / Product.new_price).asc(),),
    }[sort]
    stmt = stmt.options(selectinload(Product.variants)).order_by(*order, Product.id)
    products = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()

    return ProductPage(
        items=[ProductSummary(**summarize(p, grade.value if grade else None)) for p in products],
        total=total,
        page=page,
        pages=max(1, math.ceil(total / page_size)),
        facets=facets,
    )


@router.get("/{slug}", response_model=ProductDetail)
def get_product(slug: str, db: DB):
    product = db.scalar(select(Product).where(Product.slug == slug).options(selectinload(Product.variants)))
    if not product:
        raise HTTPException(404, "Product not found")
    return ProductDetail(
        **summarize(product),
        description=product.description,
        specs=product.specs,
        warranty_months=product.warranty_months,
        variants=product.variants,
    )


@router.get("/{slug}/related", response_model=list[ProductSummary])
def related_products(slug: str, db: DB, limit: int = Query(4, ge=1, le=12)):
    product = db.scalar(select(Product).where(Product.slug == slug))
    if not product:
        raise HTTPException(404, "Product not found")
    stmt = (
        select(Product)
        .where(Product.category == product.category, Product.id != product.id)
        .options(selectinload(Product.variants))
        .order_by((Product.brand == product.brand).desc(), Product.rating.desc())
        .limit(limit)
    )
    return [ProductSummary(**summarize(p)) for p in db.scalars(stmt)]
