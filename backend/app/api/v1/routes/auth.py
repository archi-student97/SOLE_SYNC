from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.schemas.auth import LoginRequest, LoginResponse, UserPublic
from app.services.auth_service import authenticate_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    result = await authenticate_user(payload.email, payload.password)
    if not result.get("success"):
        return LoginResponse(success=False, error="Invalid email or password")
    return LoginResponse(**result)


@router.get("/me", response_model=UserPublic)
async def me(current_user: dict = Depends(get_current_user)) -> UserPublic:
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserPublic(**current_user)
