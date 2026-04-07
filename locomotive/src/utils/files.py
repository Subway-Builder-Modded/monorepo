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
