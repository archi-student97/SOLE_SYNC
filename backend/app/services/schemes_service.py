from app.repositories.schemes_repo import create_scheme, delete_scheme, list_schemes


async def get_schemes() -> list[dict]:
    return await list_schemes()


async def create_new_scheme(scheme_data: dict) -> dict:
    return await create_scheme(scheme_data)


async def remove_scheme(scheme_id: int) -> bool:
    return await delete_scheme(scheme_id)
