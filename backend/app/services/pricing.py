"""Pricing rules shared by listings, checkout, imports and trade-ins."""
import math
import re

from app.core.config import settings

GRADE_MULTIPLIERS = {"excellent": 1.0, "good": 0.92, "fair": 0.84}
GRADE_BATTERY = {"excellent": 95, "good": 89, "fair": 84}


def round_to(value: float, step: int = 500) -> int:
    return int(math.floor(value / step + 0.5) * step)


def grade_price(excellent_price: int, grade: str) -> int:
    return round_to(excellent_price * GRADE_MULTIPLIERS[grade])


def storage_step(category: str) -> tuple[float, float]:
    """(refurbished, new) price uplift per storage tier above the base model."""
    return (0.08, 0.08) if category == "accessories" else (0.14, 0.16)


def tier_prices(base_price: int, base_new: int, category: str, tier: int) -> tuple[int, int]:
    step, new_step = storage_step(category)
    return round_to(base_price * (1 + step * tier)), round_to(base_new * (1 + new_step * tier))


def stock_for(product_index: int, tier: int, grade: str) -> int:
    """Deterministic, varied demo stock levels (some variants sell out)."""
    spread = {"excellent": 4, "good": 6, "fair": 3}[grade]
    if (product_index * 5 + tier * 7 + len(grade)) % 11 == 0:
        return 0
    return 1 + (product_index * 7 + tier * 3 + len(grade)) % spread


def delivery_fee(subtotal: int, method: str) -> int:
    if method == "pickup":
        return 0
    if method == "nairobi":
        return 0 if subtotal >= settings.FREE_DELIVERY_THRESHOLD else settings.NAIROBI_DELIVERY_FEE
    return settings.COUNTRYWIDE_DELIVERY_FEE


# ── Import calculator ────────────────────────────────────────────────────────
# Indicative KRA rates applied on the CIF value (cost + insurance + freight).
IMPORT_PROFILES = {
    "phones":      {"label": "Smartphone", "weight_kg": 0.6, "duty": 0.0,  "excise": 0.10},
    "laptops":     {"label": "Laptop",     "weight_kg": 2.5, "duty": 0.0,  "excise": 0.0},
    "tablets":     {"label": "Tablet",     "weight_kg": 1.0, "duty": 0.0,  "excise": 0.0},
    "accessories": {"label": "Accessory",  "weight_kg": 0.4, "duty": 0.25, "excise": 0.0},
}
VAT = 0.16
IDF = 0.025
RDL = 0.02
INSURANCE = 0.015
FREIGHT_USD_PER_KG = 12.0
MIN_FREIGHT_USD = 15.0
SERVICE_FEE = 0.07


def import_quote(item_price_usd: float, category: str, shipping_usd: float = 0.0) -> dict:
    profile = IMPORT_PROFILES.get(category, IMPORT_PROFILES["accessories"])
    fx = settings.USD_TO_KES

    item_kes = item_price_usd * fx
    freight_kes = max(profile["weight_kg"] * FREIGHT_USD_PER_KG, MIN_FREIGHT_USD) * fx + shipping_usd * fx
    insurance_kes = item_kes * INSURANCE
    cif = item_kes + freight_kes + insurance_kes

    duty = cif * profile["duty"]
    excise = (cif + duty) * profile["excise"]
    vat = (cif + duty + excise) * VAT
    idf = cif * IDF
    rdl = cif * RDL
    taxes = duty + excise + vat + idf + rdl
    service = item_kes * SERVICE_FEE
    total = cif + taxes + service

    lines = [
        ("Item price", item_kes),
        ("Air freight & handling", freight_kes),
        ("Transit insurance", insurance_kes),
        ("Import duty", duty),
        ("Excise duty", excise),
        ("VAT (16%)", vat),
        ("Import Declaration Fee (2.5%)", idf),
        ("Railway Development Levy (2%)", rdl),
        ("CertifiedRefurbs service fee", service),
    ]
    return {
        "category": category,
        "category_label": profile["label"],
        "exchange_rate": fx,
        "item_price_usd": round(item_price_usd, 2),
        "lines": [{"label": label, "amount": round(amount)} for label, amount in lines if round(amount) > 0],
        "cif_value": round(cif),
        "total_taxes": round(taxes),
        "total": round_to(total, 100),
        "eta_days": "7–12",
    }


# ── Trade-in estimator ──────────────────────────────────────────────────────
TRADE_IN_BASE = {"phones": 22000, "laptops": 30000, "tablets": 16000, "accessories": 6000}
BRAND_FACTOR = {"apple": 1.45, "samsung": 1.1, "google": 1.05, "dell": 1.05, "hp": 1.0, "lenovo": 1.0}
CONDITION_FACTOR = {"like_new": 1.0, "good": 0.82, "worn": 0.62, "broken": 0.3}


def _storage_factor(storage: str) -> float:
    match = re.search(r"(\d+)\s*(TB|GB)", storage.upper())
    if not match:
        return 1.0
    gb = int(match.group(1)) * (1024 if match.group(2) == "TB" else 1)
    return 0.85 if gb <= 64 else 1.0 if gb <= 128 else 1.12 if gb <= 256 else 1.25


def _model_age_factor(model: str) -> float:
    """Newer generations are worth more — read the largest number in the model name."""
    numbers = [int(n) for n in re.findall(r"\d+", model) if int(n) < 100]
    if not numbers:
        return 1.0
    return min(max(0.7 + max(numbers) * 0.04, 0.75), 1.9)


def trade_in_quote(category: str, brand: str, model: str, storage: str, condition: str) -> int:
    base = TRADE_IN_BASE.get(category, TRADE_IN_BASE["accessories"])
    value = (
        base
        * BRAND_FACTOR.get(brand.strip().lower(), 0.9)
        * _storage_factor(storage)
        * _model_age_factor(model)
        * CONDITION_FACTOR.get(condition, 0.6)
    )
    return max(round_to(value, 250), 1000)
