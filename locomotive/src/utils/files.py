from hashlib import sha256
from typing import TypeVar

import aiofiles
import pydantic

T = TypeVar("T", bound=pydantic.BaseModel)


async def read_and_validate_schema(file_path: str, schema: type[T]) -> T:
    async with aiofiles.open(file_path, "r", encoding="utf-8") as file_handle:
        content = await file_handle.read()
    try:
        return schema.model_validate_json(content)
    except pydantic.ValidationError as e:
        raise ValueError(f"Schema validation error for file {file_path}: {e}")


async def read_and_validate_schema_with_hash(file_path: str, schema: type[T]) -> tuple[T, str]:
    async with aiofiles.open(file_path, "r", encoding="utf-8") as file_handle:
        content = await file_handle.read()
        hash = sha256(content.encode("utf-8")).hexdigest()
    try:
        return schema.model_validate_json(content), hash
    except pydantic.ValidationError as e:
        raise ValueError(f"Schema validation error for file {file_path}: {e}")
