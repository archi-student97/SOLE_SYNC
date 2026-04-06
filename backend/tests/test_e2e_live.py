import os
import time

import requests


BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:8070/api/v1")


def _url(path: str) -> str:
    return f"{BASE_URL}{path}"


def _login(email: str, password: str) -> dict:
    resp = requests.post(_url("/login"), json={"email": email, "password": password}, timeout=15)
    resp.raise_for_status()
    payload = resp.json()
    assert payload.get("success") is True
    return payload


def test_end_to_end_order_flow_with_soft_delete():
    requests.post(_url("/system/init"), timeout=15).raise_for_status()

    admin = _login("admin@sole.com", "admin123")
    headers = {"Authorization": f"Bearer {admin['access_token']}"}

    suffix = str(int(time.time()))
    dist_email = f"pytest.dist.{suffix}@sole.com"
    ret_email = f"pytest.ret.{suffix}@sole.com"
    dist_pass = "PyDist@123"
    ret_pass = "PyRet@123"
    created_user_ids = []

    try:
        dist_create = requests.post(
            _url("/users"),
            headers=headers,
            json={
                "name": "Pytest Distributor",
                "role": "distributor",
                "email": dist_email,
                "password": dist_pass,
            },
            timeout=15,
        )
        dist_create.raise_for_status()
        dist_user = dist_create.json()
        created_user_ids.append(dist_user["id"])

        ret_create = requests.post(
            _url("/users"),
            headers=headers,
            json={
                "name": "Pytest Retailer",
                "role": "retailer",
                "email": ret_email,
                "password": ret_pass,
                "distributorId": dist_user["id"],
            },
            timeout=15,
        )
        ret_create.raise_for_status()
        ret_user = ret_create.json()
        created_user_ids.append(ret_user["id"])

        assert _login(dist_email, dist_pass)["user"]["role"] == "distributor"
        assert _login(ret_email, ret_pass)["user"]["role"] == "retailer"

        item_name = "Running Shoe A"
        qty = 2
        unit_price = 89.99

        order_create = requests.post(
            _url("/orders"),
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
            timeout=15,
        )
        order_create.raise_for_status()
        order = order_create.json()
        order_id = order["id"]

        approve = requests.post(_url(f"/orders/{order_id}/approve-distributor"), timeout=15)
        approve.raise_for_status()
        assert approve.json()["success"] is True

        all_orders = requests.get(_url("/orders"), timeout=15)
        all_orders.raise_for_status()
        found = [o for o in all_orders.json() if o["id"] == order_id]
        assert len(found) == 1
        assert found[0]["status"] == "approved"

        delete_resp = requests.delete(_url(f"/orders/{order_id}"), timeout=15)
        delete_resp.raise_for_status()

        all_orders_after = requests.get(_url("/orders"), timeout=15)
        all_orders_after.raise_for_status()
        found_after = [o for o in all_orders_after.json() if o["id"] == order_id]
        assert len(found_after) == 0
    finally:
        for user_id in created_user_ids:
            requests.delete(_url(f"/users/{user_id}"), headers=headers, timeout=15)
