from app.repositories.orders_repo import summarize_completed_orders_for_user
from app.repositories.users_repo import (
    add_loyalty_purchase,
    adjust_loyalty_points,
    get_user_by_id,
    set_user_loyalty_totals,
)


async def get_loyalty_points(user_id: int) -> dict:
    user = await get_user_by_id(user_id)
    if not user:
        return {"total_purchase": 0.0, "loyalty_points": 0}
    summary = await summarize_completed_orders_for_user(user_id, user.get("role"))
    synced = await set_user_loyalty_totals(user_id, summary["total_purchase"], summary["loyalty_points"])
    if not synced:
        return summary
    return {"total_purchase": synced["total_purchase"], "loyalty_points": synced["loyalty_points"]}


async def update_loyalty_points(user_id: int, points: int) -> dict:
    # Backward-compatible helper for direct points update routes.
    if points == 0:
        return await get_loyalty_points(user_id)
    if points > 0:
        amount = float(points * 10)
        await add_loyalty_purchase(user_id, amount)
    else:
        await adjust_loyalty_points(user_id, points)
    return await get_loyalty_points(user_id)


async def apply_loyalty_for_delivered_order(order: dict) -> bool:
    if not order:
        return False
    status = (order.get("status") or "").lower()
    if status not in {"delivered", "approved", "completed"}:
        return False
    if order.get("isDeleted"):
        return False
    if order.get("loyaltyCredited"):
        return False
    if order.get("fromRole") not in {"distributor", "retailer"}:
        return False

    user_id = order.get("userId")
    if not user_id:
        return False

    amount = float(order.get("totalPrice") or order.get("amount") or 0.0)
    if amount <= 0:
        return False

    updated_user = await add_loyalty_purchase(int(user_id), amount)
    return updated_user is not None
