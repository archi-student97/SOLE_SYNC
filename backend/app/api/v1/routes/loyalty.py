from fastapi import APIRouter

from app.schemas.loyalty import Loyalty, LoyaltyUpdate
from app.services.loyalty_service import get_loyalty_points, update_loyalty_points

router = APIRouter(prefix="/loyalty", tags=["loyalty"])


@router.get("", response_model=Loyalty)
async def get_loyalty_endpoint() -> Loyalty:
    return Loyalty(**(await get_loyalty_points()))


@router.post("/update", response_model=Loyalty)
async def update_loyalty_endpoint(payload: LoyaltyUpdate) -> Loyalty:
    updated = await update_loyalty_points(payload.role, payload.points)
    return Loyalty(**updated)
