from app.repositories.finance_repo import get_finance
from app.repositories.orders_repo import list_orders
from app.repositories.stock_repo import get_stock_pricing
from app.repositories.users_repo import get_retailers_for_distributor


async def get_finance_data() -> dict:
    return await get_finance()


COMPLETED_STATUSES = {"approved", "delivered", "completed"}


def _is_completed(order: dict) -> bool:
    return str(order.get("status", "")).lower() in COMPLETED_STATUSES and not bool(order.get("isDeleted"))


def _order_amount(order: dict) -> float:
    return float(order.get("totalPrice") or order.get("amount") or 0.0)


def _order_date(order: dict) -> str:
    created = order.get("createdAt")
    if not created:
        return ""
    try:
        return str(created)[:10]
    except Exception:
        return ""


def _to_int(value) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _belongs_to_scope(
    order: dict,
    role: str,
    user_id: int | None,
    linked_retailer_ids: set[int] | None = None,
) -> bool:
    if role == "management" or user_id is None:
        return True

    order_user_id = _to_int(order.get("userId"))

    if role == "retailer":
        return order_user_id == int(user_id)

    if role == "distributor":
        # Distributor's own purchases from management.
        if (
            order_user_id == int(user_id)
            and str(order.get("fromRole")) == "distributor"
            and str(order.get("toRole")) == "management"
        ):
            return True
        # Retailer sales for retailers linked under this distributor.
        if (
            str(order.get("fromRole")) == "retailer"
            and str(order.get("toRole")) == "distributor"
            and order_user_id is not None
            and linked_retailer_ids is not None
            and order_user_id in linked_retailer_ids
        ):
            return True
        return False

    return True


def _build_transactions(
    orders: list[dict],
    role: str,
    user_id: int | None = None,
    linked_retailer_ids: set[int] | None = None,
) -> list[dict]:
    tx = []
    for order in orders:
        if not _belongs_to_scope(order, role, user_id, linked_retailer_ids):
            continue

        amount = _order_amount(order)
        if amount <= 0:
            continue

        tx_type = None
        desc = ""
        from_role = order.get("fromRole")
        to_role = order.get("toRole")

        if role == "management":
            if to_role == "management":
                tx_type = "income"
                desc = f"Order #{order.get('id')} from distributor"
        elif role == "distributor":
            if to_role == "distributor" and from_role == "retailer":
                tx_type = "income"
                desc = f"Retailer order #{order.get('id')}"
            elif from_role == "distributor" and to_role == "management":
                tx_type = "expense"
                desc = f"Management order #{order.get('id')}"
        elif role == "retailer":
            if from_role == "retailer" and to_role == "distributor":
                tx_type = "expense"
                desc = f"Distributor order #{order.get('id')}"

        if tx_type:
            tx.append(
                {
                    "id": int(order.get("id") or 0),
                    "type": tx_type,
                    "amount": amount,
                    "description": desc,
                    "date": _order_date(order),
                }
            )
    tx.sort(key=lambda item: item["id"], reverse=True)
    return tx


async def get_finance_summary(role: str | None = None, user_id: int | None = None) -> dict:
    role = (role or "").strip().lower()
    if role not in {"management", "distributor", "retailer"}:
        # Backward-compatible default behavior.
        finance = await get_finance()
        return {
            "revenue": finance["revenue"],
            "expenses": finance["expenses"],
            "profit": finance["revenue"] - finance["expenses"],
            "transactions": finance.get("transactions", []),
        }

    orders = [o for o in await list_orders() if _is_completed(o)]
    linked_retailer_ids: set[int] | None = None
    if role == "distributor" and user_id is not None:
        linked_retailers = await get_retailers_for_distributor(int(user_id))
        linked_retailer_ids = {
            int(r["id"])
            for r in linked_retailers
            if _to_int(r.get("id")) is not None
        }
    revenue = 0.0
    expenses = 0.0
    pricing_cache: dict[str, dict] = {}

    for order in orders:
        if not _belongs_to_scope(order, role, user_id, linked_retailer_ids):
            continue

        amount = _order_amount(order)
        if amount <= 0:
            continue
        item_name = str(order.get("itemName") or "")
        qty = int(order.get("quantity") or 0)
        from_role = order.get("fromRole")
        to_role = order.get("toRole")

        if item_name not in pricing_cache:
            pricing_cache[item_name] = await get_stock_pricing(item_name) or {
                "managementCostPrice": 0.0,
                "managementSellPrice": float(order.get("unitPrice") or 0.0),
                "distributorSellPrice": float(order.get("unitPrice") or 0.0),
            }
        pricing = pricing_cache[item_name]

        if role == "management":
            if to_role == "management":
                revenue += amount
                expenses += float(pricing.get("managementCostPrice", 0.0)) * qty
        elif role == "distributor":
            if to_role == "distributor" and from_role == "retailer":
                revenue += amount
                # Distributor COGS is management selling price.
                expenses += float(pricing.get("managementSellPrice", 0.0)) * qty
        elif role == "retailer":
            if from_role == "retailer" and to_role == "distributor":
                expenses += amount

    return {
        "revenue": revenue,
        "expenses": expenses,
        "profit": revenue - expenses,
        "transactions": _build_transactions(
            orders,
            role,
            user_id=user_id,
            linked_retailer_ids=linked_retailer_ids,
        ),
    }
