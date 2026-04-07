from fastapi import APIRouter

from ..registry import get_asset_manifest
from ..types import AssetManifest, MapManifest

router = APIRouter(prefix="/registry", tags=["registry"])


@router.get("/mods/{mod}", tags=["registry"])
async def get_mod(mod: str) -> AssetManifest | dict:
    """Fetches mod information from the registry."""
    try:
        return await get_asset_manifest(mod, "mod")
    except FileNotFoundError:
        return {"error": "Mod not found"}
    except Exception as e:
        return {"error": str(e)}


@router.get("/maps/{map}", tags=["registry"])
async def get_map(map: str) -> MapManifest | dict:
    """Fetches map information from the registry."""
    try:
        return await get_asset_manifest(map, "map")
    except FileNotFoundError:
        return {"error": "Map not found"}
    except Exception as e:
        return {"error": str(e)}
