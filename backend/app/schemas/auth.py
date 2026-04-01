from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str


class UserManageItem(UserPublic):
    password: str


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


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str
