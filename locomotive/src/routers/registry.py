from fastapi import APIRouter

from ..registry import RegistryService
from ..types import AssetManifest, MapManifest, IntegrityVersionInfo

router = APIRouter(prefix="/registry", tags=["registry"])


@router.get("/mods/{mod}", tags=["registry"])
async def get_mod(mod: str) -> AssetManifest | dict:
    """Fetches mod information from the registry."""
    try:
        return await RegistryService.get_asset_manifest(mod, "mod")
    except FileNotFoundError:
        return {"error": "Mod not found"}
    except Exception as e:
        return {"error": str(e)}


@router.get("/maps/{map}", tags=["registry"])
async def get_map(map: str) -> MapManifest | dict:
    """Fetches map information from the registry."""
    try:
        return await RegistryService.get_asset_manifest(map, "map")
    except FileNotFoundError:
        return {"error": "Map not found"}
    except Exception as e:
        return {"error": str(e)}
    
@router.get("/maps/{map}/versions", tags=["registry"])
async def get_map_versions(map: str) -> dict[str, IntegrityVersionInfo] | dict:
    """Fetches available versions for a specific map."""
    try:
        return await RegistryService.get_asset_versions(map, "map")
    except FileNotFoundError:
        return {"error": "Map not found"}
    except Exception as e:
        return {"error": str(e)}

@router.get("/mods/{mod}/versions", tags=["registry"])
async def get_mod_versions(mod: str) -> dict[str, IntegrityVersionInfo] | dict:
    """Fetches available versions for a specific mod."""
    try:
        return await RegistryService.get_asset_versions(mod, "mod")
    except FileNotFoundError:
        return {"error": "Mod not found"}
    except Exception as e:
        return {"error": str(e)}