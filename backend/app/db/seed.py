import json
import re
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.models import Grade, Product, ProductVariant, User
from app.db.session import Base, SessionLocal, engine
from app.services.pricing import GRADE_BATTERY, grade_price

CATALOG_PATH = Path(__file__).with_name("catalog.json")
STOCK = {"excellent": 6, "good": 9, "fair": 4}


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def product_slug(item: dict) -> str:
    return slugify(f"{item['brand']} {item['name']} {item['storage']}")


def seed_catalog(db: Session) -> int:
    if db.scalar(select(Product.id).limit(1)):
        return 0
    items = json.loads(CATALOG_PATH.read_text())
    for item in items:
        product = Product(
            slug=product_slug(item),
            name=item["name"],
            brand=item["brand"],
            category=item["category"],
            storage=item["storage"],
            color=item["color"],
            subtitle=item["subtitle"],
            description=item["description"],
            specs=item["specs"],
            new_price=item["new_price"],
            rating=item["rating"],
            reviews_count=item["reviews_count"],
            hue=item["hue"],
            featured=item["featured"],
            deal=item["deal"],
        )
        product.variants = [
            ProductVariant(
                grade=Grade(grade),
                price=grade_price(item["price"], grade),
                stock=STOCK[grade],
                battery_health=GRADE_BATTERY[grade],
            )
            for grade in ("excellent", "good", "fair")
        ]
        db.add(product)
    db.commit()
    return len(items)


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
            seed_admin(db)


if __name__ == "__main__":
    init_db()
    print("Database initialised and seeded.")
