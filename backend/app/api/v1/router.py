from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, imports, listings, orders, payments, sell, site

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(sell.router, prefix="/sell", tags=["sell"])
api_router.include_router(site.router, prefix="/site", tags=["site"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
