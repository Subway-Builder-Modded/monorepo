from fastapi import APIRouter, Request
from fastapi.responses import Response

from ..registry import RegistryService
from ..types import AssetManifest, IntegrityVersionInfo, MapManifest
from ..shared import limiter

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


@router.get("/maps/{map}/gallery/{image}", tags=["registry"])
async def get_gallery_image(map: str, image: str):
    """Fetches a gallery image for a specific map."""
    try:
        image_data = await RegistryService.get_gallery_image("map", map, image)
        return Response(content=image_data, media_type=f"image/{image.split('.')[-1]}")
    except FileNotFoundError:
        return {"error": "Image not found"}
    except Exception as e:
        return {"error": str(e)}


@router.get("/mods/{mod}/gallery/{image}", tags=["registry"])
async def get_mod_gallery_image(mod: str, image: str):
    """Fetches a gallery image for a specific mod."""
    try:
        image_data = await RegistryService.get_gallery_image("mod", mod, image)
        return Response(content=image_data, media_type=f"image/{image.split('.')[-1]}")
    except FileNotFoundError:
        return {"error": "Image not found"}
    except Exception as e:
        return {"error": str(e)}
    

@router.get("/authors/{author_id}", tags=["registry"])
async def get_author_info(author_id: str, request: Request):
    """Fetches author information from the registry."""
    try:
        return await RegistryService.get_author_info_with_assets(author_id)
    except Exception as e:
        return {"error": str(e)}
