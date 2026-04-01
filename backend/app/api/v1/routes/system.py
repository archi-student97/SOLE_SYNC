from fastapi import APIRouter

from app.db.seed import seed_database_if_needed
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/system", tags=["system"])


@router.post("/init", response_model=MessageResponse)
async def init_system() -> MessageResponse:
    await seed_database_if_needed()
    return MessageResponse(message="Database initialized")
