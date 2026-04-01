from app.repositories.loyalty_repo import get_loyalty, update_loyalty


async def get_loyalty_points() -> dict:
    return await get_loyalty()


async def update_loyalty_points(role: str, points: int) -> dict:
    return await update_loyalty(role, points)
