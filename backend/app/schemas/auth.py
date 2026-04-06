from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    distributorId: int | None = None
    total_purchase: float = 0.0
    loyalty_points: int = 0


class UserManageItem(UserPublic):
    password: str
    distributorName: str | None = None


class DistributorOption(BaseModel):
    id: int
    name: str
    email: EmailStr


class RetailerOption(BaseModel):
    id: int
    name: str
    email: EmailStr
    distributorId: int | None = None


class LoginResponse(BaseModel):
    success: bool
    access_token: str | None = None
    token_type: str | None = None
    user: UserPublic | None = None
    error: str | None = None


class UserCreateRequest(BaseModel):
    name: str
    role: str
    email: EmailStr
    password: str
    distributorId: int | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str
