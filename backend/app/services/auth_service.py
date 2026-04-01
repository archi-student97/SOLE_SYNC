from jose import JWTError, jwt

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.users_repo import (
    create_user,
    delete_user_by_id,
    get_user_by_email,
    get_user_by_id,
    get_users_for_management,
    update_user_password,
)


def _to_public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
    }


async def authenticate_user(email: str, password: str) -> dict:
    user = await get_user_by_email(email)
    if not user or not verify_password(password, user["password"]):
        return {"success": False, "error": "Invalid email or password"}

    public_user = _to_public_user(user)
    token = create_access_token({"sub": str(user["id"])})
    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "user": public_user,
    }


async def get_user_from_token(token: str) -> dict | None:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            return None
    except JWTError:
        return None

    user = await get_user_by_id(int(user_id))
    if not user:
        return None
    return _to_public_user(user)


async def create_user_account(name: str, role: str, email: str, password: str) -> dict:
    normalized_role = role.lower().strip()
    if normalized_role not in {"distributor", "retailer"}:
        return {"success": False, "error": "Role must be distributor or retailer"}

    existing = await get_user_by_email(email)
    if existing:
        return {"success": False, "error": "User already exists with this email"}

    created = await create_user(
        {
            "name": name,
            "role": normalized_role,
            "email": email,
            "password": hash_password(password),
            "plainPassword": password,
        }
    )
    return {"success": True, "user": created}


async def reset_password(email: str, new_password: str) -> dict:
    user = await get_user_by_email(email)
    if not user:
        return {"success": False, "error": "User not found"}

    updated = await update_user_password(email, hash_password(new_password))
    if not updated:
        return {"success": False, "error": "Password update failed"}
    # Keep a displayable password for management listing.
    user = await get_user_by_email(email)
    if user and user.get("role") in {"distributor", "retailer"}:
        from app.db.mongodb import get_db

        db = get_db()
        await db.users.update_one({"email": email}, {"$set": {"plainPassword": new_password}})
    return {"success": True, "message": "Password updated successfully"}


async def list_users_for_management() -> list[dict]:
    return await get_users_for_management()


async def remove_user_account(user_id: int) -> dict:
    deleted = await delete_user_by_id(user_id)
    if not deleted:
        return {"success": False, "error": "User not found"}
    return {"success": True, "message": "User deleted"}
