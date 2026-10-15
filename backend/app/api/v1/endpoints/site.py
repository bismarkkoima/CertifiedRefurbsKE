from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import DB
from app.db.models import ContactMessage, NewsletterSubscriber
from app.schemas import ContactIn, MessageOut, NewsletterIn

router = APIRouter()


@router.post("/newsletter", response_model=MessageOut, status_code=201)
def subscribe(data: NewsletterIn, db: DB):
    email = data.email.lower()
    if not db.scalar(select(NewsletterSubscriber).where(NewsletterSubscriber.email == email)):
        db.add(NewsletterSubscriber(email=email))
        db.commit()
    return MessageOut(message="You're subscribed — watch your inbox for weekly deals.")


@router.post("/contact", response_model=MessageOut, status_code=201)
def contact(data: ContactIn, db: DB):
    db.add(ContactMessage(**data.model_dump()))
    db.commit()
    return MessageOut(message="Thanks for reaching out. Our team replies within one business day.")
