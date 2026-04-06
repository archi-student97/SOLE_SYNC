from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.loyalty import Loyalty, LoyaltyUpdate
from app.services.loyalty_service import get_loyalty_points, update_loyalty_points

router = APIRouter(prefix="/loyalty", tags=["loyalty"])


@router.get("", response_model=Loyalty)
async def get_loyalty_endpoint(current_user: dict = Depends(get_current_user)) -> Loyalty:
    return Loyalty(**(await get_loyalty_points(current_user["id"])))


@router.post("/update", response_model=Loyalty)
async def update_loyalty_endpoint(payload: LoyaltyUpdate, current_user: dict = Depends(get_current_user)) -> Loyalty:
    updated = await update_loyalty_points(current_user["id"], payload.points)
    return Loyalty(**updated)
