from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    UserCreateRequest,
    UserManageItem,
    UserPublic,
)
from app.schemas.common import MessageResponse
from app.services.auth_service import (
    authenticate_user,
    create_user_account,
    list_users_for_management,
    remove_user_account,
    reset_password,
)

router = APIRouter(tags=["access"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    result = await authenticate_user(payload.email, payload.password)
    if not result.get("success"):
        return LoginResponse(success=False, error="Invalid email or password")
    return LoginResponse(**result)


@router.post("/users", response_model=UserPublic)
async def create_user_endpoint(
    payload: UserCreateRequest,
    current_user: dict = Depends(get_current_user),
) -> UserPublic:
    if current_user.get("role") != "management":
        raise HTTPException(status_code=403, detail="Only management can create users")

    result = await create_user_account(payload.name, payload.role, payload.email, payload.password)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return UserPublic(**result["user"])


@router.get("/users", response_model=list[UserManageItem])
async def get_users_endpoint(current_user: dict = Depends(get_current_user)) -> list[UserManageItem]:
    if current_user.get("role") != "management":
        raise HTTPException(status_code=403, detail="Only management can view users")
    users = await list_users_for_management()
    return [UserManageItem(**u) for u in users]


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user_endpoint(user_id: int, current_user: dict = Depends(get_current_user)) -> MessageResponse:
    if current_user.get("role") != "management":
        raise HTTPException(status_code=403, detail="Only management can delete users")
    result = await remove_user_account(user_id)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error"))
    return MessageResponse(message=result["message"])


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest) -> MessageResponse:
    result = await reset_password(payload.email, payload.new_password)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return MessageResponse(message=result["message"])
