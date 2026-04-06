import os
import time
from typing import Any

import requests
from pymongo import MongoClient


BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:8070/api/v1")
MONGODB_URI = os.getenv("E2E_MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("E2E_MONGODB_DB_NAME", "sole_sync")


def api(method: str, path: str, **kwargs: Any) -> requests.Response:
    return requests.request(method, f"{BASE_URL}{path}", timeout=20, **kwargs)


def login(email: str, password: str) -> dict:
    resp = api("POST", "/login", json={"email": email, "password": password})
    resp.raise_for_status()
    payload = resp.json()
    assert payload.get("success") is True
    return payload


def get_order_by_id(order_id: int) -> dict | None:
    resp = api("GET", "/orders")
    resp.raise_for_status()
    for order in resp.json():
        if order["id"] == order_id:
            return order
    return None


def delete_stock_by_id(stock_id: int) -> None:
    client = MongoClient(MONGODB_URI)
    try:
        client[MONGODB_DB_NAME].stock.delete_one({"id": stock_id})
    finally:
        client.close()


def test_system_and_auth_routes():
    init = api("POST", "/system/init")
    init.raise_for_status()
    assert init.json()["message"] == "Database initialized"

    admin = login("admin@sole.com", "admin123")
    token = admin["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    auth_login = api("POST", "/auth/login", json={"email": "admin@sole.com", "password": "admin123"})
    auth_login.raise_for_status()
    assert auth_login.json()["success"] is True

    me = api("GET", "/auth/me", headers=auth_headers)
    me.raise_for_status()
    me_data = me.json()
    assert me_data["email"] == "admin@sole.com"
    assert me_data["role"] == "management"


def test_user_management_and_forgot_password_routes():
    admin = login("admin@sole.com", "admin123")
    auth_headers = {"Authorization": f"Bearer {admin['access_token']}"}

    suffix = str(int(time.time()))
    user_email = f"pytest.user.{suffix}@sole.com"
    old_password = "OldPy@123"
    new_password = "NewPy@123"
    created_user_id = None

    try:
        create = api(
            "POST",
            "/users",
            headers=auth_headers,
            json={
                "name": "Pytest User",
                "role": "distributor",
                "email": user_email,
                "password": old_password,
            },
        )
        create.raise_for_status()
        user = create.json()
        created_user_id = user["id"]
        assert user["email"] == user_email

        users = api("GET", "/users", headers=auth_headers)
        users.raise_for_status()
        users_data = users.json()
        found = [u for u in users_data if u["email"] == user_email]
        assert len(found) == 1
        assert "password" in found[0]

        assert login(user_email, old_password)["user"]["role"] == "distributor"

        forgot = api("POST", "/forgot-password", json={"email": user_email, "new_password": new_password})
        forgot.raise_for_status()
        assert "updated" in forgot.json()["message"].lower()

        assert login(user_email, new_password)["success"] is True
    finally:
        if created_user_id is not None:
            api("DELETE", f"/users/{created_user_id}", headers=auth_headers)


def test_stock_schemes_loyalty_finance_routes():
    item_name = f"PyTest Shoe {int(time.time())}"
    scheme_id = None
    stock_id = None

    admin = login("admin@sole.com", "admin123")
    auth_headers = {"Authorization": f"Bearer {admin['access_token']}"}

    # Stock list by all roles.
    for role in ("management", "distributor", "retailer"):
        stock_list = api("GET", f"/stock?role={role}")
        stock_list.raise_for_status()
        assert isinstance(stock_list.json(), list)

    # Create + update + adjust + check + deduct stock.
    create_stock = api(
        "POST",
        "/stock",
        json={"name": item_name, "quantity": 40, "price": 99.5},
    )
    create_stock.raise_for_status()
    created = create_stock.json()
    stock_id = created["id"]
    assert created["name"] == item_name

    update_stock = api(
        "PATCH",
        f"/stock/{stock_id}?role=management",
        json={"quantity": 41},
    )
    update_stock.raise_for_status()
    assert update_stock.json()["quantity"] == 41

    adjust_stock = api(
        "POST",
        f"/stock/{stock_id}/adjust",
        json={"delta": 3, "role": "management"},
    )
    adjust_stock.raise_for_status()
    assert adjust_stock.json()["quantity"] == 44

    avail = api(
        "GET",
        f"/stock/check-availability?itemName={item_name}&quantity=2&role=management",
    )
    avail.raise_for_status()
    assert avail.json()["available"] is True

    deduct = api(
        "POST",
        "/stock/deduct",
        json={"itemName": item_name, "quantity": 4, "role": "management"},
    )
    deduct.raise_for_status()
    assert deduct.json()["quantity"] == 40

    summary = api("GET", "/stock/summary?role=management")
    summary.raise_for_status()
    summary_data = summary.json()
    assert summary_data["itemCount"] >= 1
    assert summary_data["totalItems"] >= 1

    # Schemes create/delete.
    schemes_before = api("GET", "/schemes")
    schemes_before.raise_for_status()

    create_scheme = api(
        "POST",
        "/schemes",
        json={"name": f"PyTest Scheme {int(time.time())}", "discount": 5.0, "validity": "2026-12-31"},
    )
    create_scheme.raise_for_status()
    scheme = create_scheme.json()
    scheme_id = scheme["id"]
    assert scheme["discount"] == 5.0

    delete_scheme = api("DELETE", f"/schemes/{scheme_id}")
    delete_scheme.raise_for_status()

    # Loyalty read (purchase-based recalculated totals).
    loyalty_before = api("GET", "/loyalty", headers=auth_headers)
    loyalty_before.raise_for_status()
    before = loyalty_before.json()
    assert "total_purchase" in before
    assert "loyalty_points" in before

    # Finance endpoints.
    finance = api("GET", "/finance")
    finance.raise_for_status()
    finance_data = finance.json()
    assert "revenue" in finance_data
    assert "expenses" in finance_data
    assert isinstance(finance_data["transactions"], list)

    finance_summary = api("GET", "/finance/summary")
    finance_summary.raise_for_status()
    summary_payload = finance_summary.json()
    assert "profit" in summary_payload

    # Cleanup extra stock item to keep DB tidy.
    if stock_id is not None:
        delete_stock_by_id(stock_id)

    # Scheme should already be deleted; keep defensive cleanup.
    if scheme_id is not None:
        api("DELETE", f"/schemes/{scheme_id}")


def test_orders_routes_surface():
    created_order_ids = []

    item_name = "Running Shoe A"
    qty = 1
    unit_price = 89.99

    try:
        # Order A: approve through distributor.
        order_a_resp = api(
            "POST",
            "/orders",
            json={
                "itemName": item_name,
                "quantity": qty,
                "totalPrice": round(unit_price * qty, 2),
                "unitPrice": unit_price,
                "fromRole": "retailer",
                "toRole": "distributor",
                "status": "pending",
                "linkedOrderId": None,
                "isDeleted": False,
            },
        )
        order_a_resp.raise_for_status()
        order_a = order_a_resp.json()
        created_order_ids.append(order_a["id"])

        by_status_pending = api("GET", "/orders/status/pending")
        by_status_pending.raise_for_status()
        assert any(o["id"] == order_a["id"] for o in by_status_pending.json())

        by_role_retailer = api("GET", "/orders/role/retailer")
        by_role_retailer.raise_for_status()
        assert any(o["id"] == order_a["id"] for o in by_role_retailer.json())

        forward = api("POST", f"/orders/{order_a['id']}/forward")
        forward.raise_for_status()
        assert forward.json()["status"] == "forwarded"

        back_to_pending = api("PATCH", f"/orders/{order_a['id']}/status", json={"status": "pending"})
        back_to_pending.raise_for_status()
        assert back_to_pending.json()["status"] == "pending"

        approve_distributor = api("POST", f"/orders/{order_a['id']}/approve-distributor")
        approve_distributor.raise_for_status()
        approve_payload = approve_distributor.json()
        assert approve_payload["success"] is True

        approved_now = get_order_by_id(order_a["id"])
        assert approved_now is not None
        assert approved_now["status"] == "approved"

        # Order B: create and reject.
        order_b_resp = api(
            "POST",
            "/orders",
            json={
                "itemName": item_name,
                "quantity": 1,
                "totalPrice": round(unit_price, 2),
                "unitPrice": unit_price,
                "fromRole": "retailer",
                "toRole": "distributor",
                "status": "pending",
                "linkedOrderId": None,
                "isDeleted": False,
            },
        )
        order_b_resp.raise_for_status()
        order_b = order_b_resp.json()
        created_order_ids.append(order_b["id"])

        reject = api("POST", f"/orders/{order_b['id']}/reject")
        reject.raise_for_status()
        assert reject.json()["status"] == "rejected"

        # Order C + restock D: request restock and approve by management.
        order_c_resp = api(
            "POST",
            "/orders",
            json={
                "itemName": item_name,
                "quantity": 1,
                "totalPrice": round(unit_price, 2),
                "unitPrice": unit_price,
                "fromRole": "retailer",
                "toRole": "distributor",
                "status": "pending",
                "linkedOrderId": None,
                "isDeleted": False,
            },
        )
        order_c_resp.raise_for_status()
        order_c = order_c_resp.json()
        created_order_ids.append(order_c["id"])

        restock_resp = api(
            "POST",
            f"/orders/{order_c['id']}/request-restock",
            json={
                "itemName": item_name,
                "quantity": 1,
                "totalPrice": round(unit_price, 2),
                "unitPrice": unit_price,
            },
        )
        restock_resp.raise_for_status()
        restock_order = restock_resp.json()
        created_order_ids.append(restock_order["id"])

        approve_mgmt = api("POST", f"/orders/{restock_order['id']}/approve-management")
        approve_mgmt.raise_for_status()
        assert approve_mgmt.json()["status"] == "approved"

        # Soft delete one approved order and ensure it disappears from listing.
        delete_resp = api("DELETE", f"/orders/{order_a['id']}")
        delete_resp.raise_for_status()
        deleted_lookup = get_order_by_id(order_a["id"])
        assert deleted_lookup is None
    finally:
        # Best-effort cleanup: soft-delete created orders still visible.
        for order_id in created_order_ids:
            try:
                if get_order_by_id(order_id) is not None:
                    api("DELETE", f"/orders/{order_id}")
            except requests.RequestException:
                pass
