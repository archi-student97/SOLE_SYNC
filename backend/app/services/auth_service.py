from jose import JWTError, jwt

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.users_repo import (
    create_user,
    delete_user_by_id,
    get_distributors_for_management,
    get_retailers_for_distributor,
    get_user_by_email,
    get_user_by_id,
    get_users_for_management,
    set_plain_password_for_user,
    update_user_password,
)


def _to_public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "distributorId": user.get("distributorId"),
        "total_purchase": float(user.get("total_purchase", 0.0)),
        "loyalty_points": int(user.get("loyalty_points", 0)),
    }


async def authenticate_user(email: str, password: str) -> dict:
    user = await get_user_by_email(email)
    password_hash = (user or {}).get("password")
    if not user or not password_hash or not verify_password(password, password_hash):
        return {"success": False, "error": "Invalid email or password"}

    # Backfill plainPassword for legacy distributor/retailer users so management can view credentials.
    if user.get("role") in {"distributor", "retailer"} and not user.get("plainPassword"):
        await set_plain_password_for_user(user["id"], password)

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


async def create_user_account(
    name: str, role: str, email: str, password: str, distributor_id: int | None = None
) -> dict:
    normalized_role = role.lower().strip()
    if normalized_role not in {"distributor", "retailer"}:
        return {"success": False, "error": "Role must be distributor or retailer"}

    existing = await get_user_by_email(email)
    if existing:
        return {"success": False, "error": "User already exists with this email"}

    if normalized_role == "retailer":
        if distributor_id is None:
            return {"success": False, "error": "Distributor selection is required for retailer"}
        distributor = await get_user_by_id(int(distributor_id))
        if not distributor or distributor.get("role") != "distributor":
            return {"success": False, "error": "Selected distributor not found"}

    created = await create_user(
        {
            "name": name,
            "role": normalized_role,
            "email": email,
            "password": hash_password(password),
            "plainPassword": password,
            "distributorId": int(distributor_id) if normalized_role == "retailer" else None,
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


async def list_distributors_for_management() -> list[dict]:
    return await get_distributors_for_management()


async def list_retailers_for_distributor(distributor_id: int) -> list[dict]:
    return await get_retailers_for_distributor(distributor_id)


async def remove_user_account(user_id: int) -> dict:
    deleted = await delete_user_by_id(user_id)
    if not deleted:
        return {"success": False, "error": "User not found"}
    return {"success": True, "message": "User deleted"}
