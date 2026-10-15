"""Safaricom Daraja (Lipa Na M-Pesa Online / STK Push) client.

MPESA_ENV=simulate runs entirely offline: STK pushes are accepted instantly and
complete successfully a few seconds later, so the checkout flow can be
exercised without Daraja credentials. Phone numbers ending in 000 simulate a
cancelled payment.
"""
import base64
import re
import time
import uuid
from dataclasses import dataclass
from datetime import datetime

import httpx

from app.core.config import settings

BASE_URLS = {
    "sandbox": "https://sandbox.safaricom.co.ke",
    "production": "https://api.safaricom.co.ke",
}
SIMULATED_DELAY_SECONDS = 6


class MpesaError(Exception):
    pass


@dataclass
class StkPushResult:
    merchant_request_id: str
    checkout_request_id: str
    customer_message: str


@dataclass
class StkQueryResult:
    status: str  # "pending" | "success" | "failed"
    result_desc: str
    receipt: str | None = None


def normalize_phone(phone: str) -> str:
    """Convert 07XX / 01XX / +254 numbers to the 2547XXXXXXXX format Daraja expects."""
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("0") and len(digits) == 10:
        digits = "254" + digits[1:]
    elif len(digits) == 9 and digits[0] in "17":
        digits = "254" + digits
    if not re.fullmatch(r"254[17]\d{8}", digits):
        raise MpesaError("Enter a valid Safaricom number, e.g. 0712 345 678")
    return digits


class DarajaClient:
    def __init__(self) -> None:
        self.env = settings.MPESA_ENV
        self._token: str | None = None
        self._token_expiry = 0.0
        self._simulated: dict[str, tuple[float, str]] = {}

    @property
    def simulated(self) -> bool:
        return self.env not in BASE_URLS

    def _password(self, timestamp: str) -> str:
        raw = f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}"
        return base64.b64encode(raw.encode()).decode()

    def _access_token(self) -> str:
        if self._token and time.time() < self._token_expiry:
            return self._token
        resp = httpx.get(
            f"{BASE_URLS[self.env]}/oauth/v1/generate?grant_type=client_credentials",
            auth=(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET),
            timeout=15,
        )
        if resp.status_code != 200:
            raise MpesaError("Could not authenticate with M-Pesa")
        data = resp.json()
        self._token = data["access_token"]
        self._token_expiry = time.time() + int(data.get("expires_in", 3599)) - 60
        return self._token

    def stk_push(self, phone: str, amount: int, account_reference: str, description: str) -> StkPushResult:
        phone = normalize_phone(phone)
        if self.simulated:
            checkout_id = f"ws_CO_SIM_{uuid.uuid4().hex[:16].upper()}"
            self._simulated[checkout_id] = (time.time(), phone)
            return StkPushResult(f"SIM-{uuid.uuid4().hex[:10]}", checkout_id, "Success. Request accepted for processing")

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        payload = {
            "BusinessShortCode": settings.MPESA_SHORTCODE,
            "Password": self._password(timestamp),
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone,
            "PartyB": settings.MPESA_SHORTCODE,
            "PhoneNumber": phone,
            "CallBackURL": settings.MPESA_CALLBACK_URL,
            "AccountReference": account_reference[:12],
            "TransactionDesc": description[:13],
        }
        resp = httpx.post(
            f"{BASE_URLS[self.env]}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {self._access_token()}"},
            timeout=20,
        )
        data = resp.json()
        if resp.status_code != 200 or data.get("ResponseCode") != "0":
            raise MpesaError(data.get("errorMessage") or data.get("ResponseDescription") or "STK push failed")
        return StkPushResult(data["MerchantRequestID"], data["CheckoutRequestID"], data.get("CustomerMessage", ""))

    def stk_query(self, checkout_request_id: str) -> StkQueryResult:
        if self.simulated:
            started, phone = self._simulated.get(checkout_request_id, (0.0, ""))
            if time.time() - started < SIMULATED_DELAY_SECONDS:
                return StkQueryResult("pending", "Awaiting customer PIN")
            if phone.endswith("000"):
                return StkQueryResult("failed", "Request cancelled by user")
            return StkQueryResult("success", "The service request is processed successfully.",
                                  f"S{uuid.uuid4().hex[:9].upper()}")

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        resp = httpx.post(
            f"{BASE_URLS[self.env]}/mpesa/stkpushquery/v1/query",
            json={
                "BusinessShortCode": settings.MPESA_SHORTCODE,
                "Password": self._password(timestamp),
                "Timestamp": timestamp,
                "CheckoutRequestID": checkout_request_id,
            },
            headers={"Authorization": f"Bearer {self._access_token()}"},
            timeout=20,
        )
        data = resp.json()
        if "ResultCode" not in data:
            return StkQueryResult("pending", data.get("errorMessage", "Processing"))
        code = str(data["ResultCode"])
        return StkQueryResult("success" if code == "0" else "failed", data.get("ResultDesc", ""))

    @staticmethod
    def parse_callback(body: dict) -> tuple[str, StkQueryResult]:
        cb = body["Body"]["stkCallback"]
        receipt = None
        for item in cb.get("CallbackMetadata", {}).get("Item", []):
            if item.get("Name") == "MpesaReceiptNumber":
                receipt = item.get("Value")
        status = "success" if int(cb["ResultCode"]) == 0 else "failed"
        return cb["CheckoutRequestID"], StkQueryResult(status, cb.get("ResultDesc", ""), receipt)


daraja = DarajaClient()
