import json
import re
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.models import Coupon, Grade, Product, ProductVariant, User
from app.db.session import Base, SessionLocal, engine
from app.services.pricing import GRADE_BATTERY, grade_price, stock_for, tier_prices

CATALOG_PATH = Path(__file__).with_name("catalog.json")
GRADES = ("excellent", "good", "fair")
COUPONS = [
    {"code": "KARIBU5", "description": "5% off your first order (max KSh 5,000)", "percent_off": 5,
     "max_discount": 5000, "min_subtotal": 10000},
    {"code": "STUDENT2K", "description": "KSh 2,000 off orders over KSh 40,000", "amount_off": 2000,
     "min_subtotal": 40000},
]


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def product_slug(item: dict) -> str:
    return slugify(f"{item['brand']} {item['name']}")


def build_product(item: dict, index: int) -> Product:
    product = Product(
        slug=product_slug(item),
        name=item["name"],
        brand=item["brand"],
        category=item["category"],
        year=item["year"],
        tagline=item["tagline"],
        subtitle=item["subtitle"],
        description=item["description"],
        specs=item["specs"],
        colors=item["colors"],
        new_price=item["new_price"],
        hue=item["hue"],
        featured=item["featured"],
        deal=item["deal"],
    )
    for tier, storage in enumerate(item["storages"]):
        price, new_price = tier_prices(item["price"], item["new_price"], item["category"], tier)
        for grade in GRADES:
            product.variants.append(ProductVariant(
                grade=Grade(grade),
                storage=storage,
                price=grade_price(price, grade),
                new_price=new_price,
                stock=stock_for(index, tier, grade),
                battery_health=GRADE_BATTERY[grade],
            ))
    return product


def seed_catalog(db: Session) -> int:
    if db.scalar(select(Product.id).limit(1)):
        return 0
    items = json.loads(CATALOG_PATH.read_text())
    db.add_all(build_product(item, i) for i, item in enumerate(items))
    db.commit()
    return len(items)


def seed_coupons(db: Session) -> None:
    for data in COUPONS:
        if not db.scalar(select(Coupon).where(Coupon.code == data["code"])):
            db.add(Coupon(**data))
    db.commit()


def seed_admin(db: Session) -> None:
    if db.scalar(select(User).where(User.email == settings.ADMIN_EMAIL)):
        return
    db.add(
        User(
            email=settings.ADMIN_EMAIL,
            full_name="Store Admin",
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            is_admin=True,
        )
    )
    db.commit()


def init_db(seed: bool = True) -> None:
    Base.metadata.create_all(bind=engine)
    if seed:
        with SessionLocal() as db:
            seed_catalog(db)
            seed_coupons(db)
            seed_admin(db)


if __name__ == "__main__":
    init_db()
    print("Database initialised and seeded.")
