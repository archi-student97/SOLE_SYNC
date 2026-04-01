from fastapi import APIRouter, HTTPException

from app.schemas.common import MessageResponse
from app.schemas.scheme import Scheme, SchemeCreate
from app.services.schemes_service import create_new_scheme, get_schemes, remove_scheme

router = APIRouter(prefix="/schemes", tags=["schemes"])


@router.get("", response_model=list[Scheme])
async def list_schemes_endpoint() -> list[Scheme]:
    return [Scheme(**scheme) for scheme in await get_schemes()]


@router.post("", response_model=Scheme)
async def create_scheme_endpoint(payload: SchemeCreate) -> Scheme:
    created = await create_new_scheme(payload.model_dump())
    return Scheme(**created)


@router.delete("/{scheme_id}", response_model=MessageResponse)
async def delete_scheme_endpoint(scheme_id: int) -> MessageResponse:
    deleted = await remove_scheme(scheme_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return MessageResponse(message="Scheme deleted")
