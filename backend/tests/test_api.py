from app.services.mpesa import daraja_client


def test_listings_filters_and_facets(client):
    res = client.get("/api/v1/listings", params={"category": "phones", "brand": "Apple", "sort": "price_asc"})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 5
    prices = [p["price_from"] for p in data["items"]]
    assert prices == sorted(prices)
    assert {f["value"] for f in data["facets"]["brand"]} >= {"Apple", "Samsung"}


def test_search_and_detail(client):
    items = client.get("/api/v1/listings", params={"q": "macbook"}).json()["items"]
    assert items and all("MacBook" in p["name"] for p in items)
    detail = client.get(f"/api/v1/listings/{items[0]['slug']}").json()
    assert {v["grade"] for v in detail["variants"]} == {"excellent", "good", "fair"}
    assert client.get("/api/v1/listings/nope").status_code == 404


def _place_order(client, phone="0712345678"):
    product = client.get("/api/v1/listings", params={"q": "iphone 13"}).json()["items"][0]
    variant = client.get(f"/api/v1/listings/{product['slug']}").json()["variants"][0]
    res = client.post("/api/v1/orders", json={
        "customer_name": "Jane Wanjiku", "phone": phone, "email": "jane@example.com",
        "address": "Moi Avenue", "city": "Nairobi", "delivery_method": "nairobi",
        "items": [{"variant_id": variant["id"], "quantity": 1}],
    })
    assert res.status_code == 201, res.text
    return res.json(), variant


def test_checkout_payment_and_escrow(client, monkeypatch):
    monkeypatch.setattr(daraja_client, "SIMULATED_DELAY_SECONDS", 0)
    order, variant = _place_order(client)
    assert order["total"] == variant["price"]  # free Nairobi delivery over threshold

    pay = client.post("/api/v1/payments/mpesa/stkpush", json={"order_number": order["number"], "phone": "0712345678"})
    assert pay.status_code == 201
    status = client.get(f"/api/v1/payments/{pay.json()['checkout_request_id']}").json()
    assert status["status"] == "success" and status["order_status"] == "paid"

    tracked = client.get(f"/api/v1/orders/{order['number']}", params={"phone": "+254712345678"}).json()
    assert tracked["escrow_status"] == "held"
    assert client.get(f"/api/v1/orders/{order['number']}", params={"phone": "0799999999"}).status_code == 404

    # Delivery can't be confirmed before shipping.
    confirm = client.post(f"/api/v1/orders/{order['number']}/confirm-delivery", params={"phone": "0712345678"})
    assert confirm.status_code == 409


def test_failed_payment(client, monkeypatch):
    monkeypatch.setattr(daraja_client, "SIMULATED_DELAY_SECONDS", 0)
    order, _ = _place_order(client, phone="0712345000")
    pay = client.post("/api/v1/payments/mpesa/stkpush", json={"order_number": order["number"], "phone": "0712345000"})
    status = client.get(f"/api/v1/payments/{pay.json()['checkout_request_id']}").json()
    assert status["status"] == "failed" and status["order_status"] == "pending_payment"


def test_admin_flow(client, monkeypatch):
    monkeypatch.setattr(daraja_client, "SIMULATED_DELAY_SECONDS", 0)
    order, _ = _place_order(client)
    pay = client.post("/api/v1/payments/mpesa/stkpush", json={"order_number": order["number"], "phone": "0712345678"})
    client.get(f"/api/v1/payments/{pay.json()['checkout_request_id']}")

    token = client.post("/api/v1/auth/login", json={"email": "admin@certifiedrefurbs.co.ke",
                                                    "password": "admin12345"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/v1/admin/stats", headers=headers).json()["paid_orders"] == 1
    res = client.patch(f"/api/v1/admin/orders/{order['number']}", json={"status": "shipped"}, headers=headers)
    assert res.json()["status"] == "shipped"

    done = client.post(f"/api/v1/orders/{order['number']}/confirm-delivery", params={"phone": "0712345678"}).json()
    assert done["status"] == "completed" and done["escrow_status"] == "released"


def test_auth_and_my_orders(client):
    res = client.post("/api/v1/auth/register", json={"email": "Kev@Example.com", "full_name": "Kevin Otieno",
                                                     "password": "supersecret"})
    assert res.status_code == 201
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}
    assert client.get("/api/v1/auth/me", headers=headers).json()["email"] == "kev@example.com"
    assert client.post("/api/v1/auth/register", json={"email": "kev@example.com", "full_name": "K",
                                                      "password": "supersecret"}).status_code in (409, 422)
    assert client.get("/api/v1/orders/mine", headers=headers).json() == []
    assert client.get("/api/v1/admin/stats", headers=headers).status_code == 403


def test_import_quote_and_trade_in(client):
    quote = client.post("/api/v1/imports/quote", json={"item_price_usd": 500, "category": "phones"}).json()
    assert quote["total"] > 500 * quote["exchange_rate"]
    assert any(line["label"].startswith("Excise") for line in quote["lines"])

    req = client.post("/api/v1/imports/requests", json={
        "item_price_usd": 500, "category": "phones", "full_name": "Ann", "phone": "0712345678",
        "email": "ann@example.com", "item_description": "Pixel 8"})
    assert req.status_code == 201 and req.json()["reference"].startswith("IMP-")

    q_new = client.post("/api/v1/sell/quote", json={"category": "phones", "brand": "Apple", "model": "iPhone 14",
                                                    "storage": "256GB", "condition": "like_new"}).json()
    q_old = client.post("/api/v1/sell/quote", json={"category": "phones", "brand": "Apple", "model": "iPhone 8",
                                                    "storage": "64GB", "condition": "worn"}).json()
    assert q_new["quoted_price"] > q_old["quoted_price"]


def test_mpesa_callback(client):
    order, _ = _place_order(client)
    pay = client.post("/api/v1/payments/mpesa/stkpush",
                      json={"order_number": order["number"], "phone": "0712345678"}).json()
    body = {"Body": {"stkCallback": {
        "MerchantRequestID": "x", "CheckoutRequestID": pay["checkout_request_id"], "ResultCode": 0,
        "ResultDesc": "ok", "CallbackMetadata": {"Item": [{"Name": "MpesaReceiptNumber", "Value": "QWE123"}]}}}}
    assert client.post("/api/v1/payments/mpesa/callback", json=body).json()["ResultCode"] == 0
    status = client.get(f"/api/v1/payments/{pay['checkout_request_id']}").json()
    assert status["status"] == "success" and status["mpesa_receipt"] == "QWE123"
