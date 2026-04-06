from datetime import datetime, timezone

from app.db.mongodb import get_db


def _normalize_scheme(doc: dict | None) -> dict | None:
    if not doc:
        return None

    created_at = doc.get("createdAt", doc.get("created_at"))
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except ValueError:
            created_at = datetime.now(timezone.utc)
    elif created_at is None:
        created_at = datetime.now(timezone.utc)

    return {
        "id": doc.get("id"),
        "name": doc.get("name"),
        "discount": doc.get("discount"),
        "validity": doc.get("validity"),
        "createdAt": created_at,
    }


async def list_schemes() -> list[dict]:
    db = get_db()
    docs = await db.schemes.find({}, {"_id": 0}).sort("createdAt", -1).to_list(length=None)
    return [_normalize_scheme(doc) for doc in docs]


async def create_scheme(scheme_data: dict) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)
    new_scheme = {
        **scheme_data,
        "id": int(now.timestamp() * 1000),
        "createdAt": now,
    }
    await db.schemes.insert_one(new_scheme)
    return _normalize_scheme(new_scheme)


async def delete_scheme(scheme_id: int) -> bool:
    db = get_db()
    result = await db.schemes.delete_one({"id": scheme_id})
    return result.deleted_count > 0
