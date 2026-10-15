"""Reference-price lookup used by staff when pricing imported stock.

It reads the public schema.org Product/Offer JSON-LD that product pages embed,
so it never needs credentials. It is never run automatically — call it from a
shell or an admin job, and respect the target site's terms and robots.txt.
"""
import json
import re
from dataclasses import dataclass

import httpx

USER_AGENT = "CertifiedRefurbsKE-PriceCheck/1.0 (+https://certifiedrefurbs.co.ke)"
JSON_LD_RE = re.compile(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', re.S)


@dataclass
class ReferencePrice:
    name: str
    price: float
    currency: str
    url: str


def _iter_offers(node):
    if isinstance(node, list):
        for child in node:
            yield from _iter_offers(child)
    elif isinstance(node, dict):
        if node.get("@type") == "Product":
            offers = node.get("offers") or {}
            for offer in offers if isinstance(offers, list) else [offers]:
                price = offer.get("lowPrice") or offer.get("price")
                if price is not None:
                    yield node.get("name", ""), float(price), offer.get("priceCurrency", "")
        for value in node.values():
            if isinstance(value, (dict, list)):
                yield from _iter_offers(value)


def extract_prices(html: str, url: str) -> list[ReferencePrice]:
    prices = []
    for block in JSON_LD_RE.findall(html):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        prices.extend(ReferencePrice(name, price, currency, url) for name, price, currency in _iter_offers(data))
    return prices


def fetch_reference_prices(url: str) -> list[ReferencePrice]:
    resp = httpx.get(url, headers={"User-Agent": USER_AGENT}, timeout=20, follow_redirects=True)
    resp.raise_for_status()
    return extract_prices(resp.text, url)
