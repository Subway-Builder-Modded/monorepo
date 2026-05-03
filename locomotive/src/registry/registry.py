import json
import os
import time
from typing import Dict, List

import aiofiles
import git
from loguru import logger

from ..types import (
    InitialViewState,
    IntegrityReport,
    IntegrityVersionInfo,
    MapManifest,
    ModManifest,
    Update,
    Update1,
    UpdateConfig,
    registry_types,
)
from ..utils import files


class RegistryService:
    _author_details_cache: Dict[str, registry_types.AuthorDetails] | None = None
    _author_details_hash: str | None = None

    _index_cache: Dict[str, List[bool, IntegrityReport]] = {"map": [False, None], "mod": [False, None]}

    @staticmethod
    def get_repository_path() -> str:
        return os.path.join(os.path.dirname(os.path.realpath(__file__)), "..", "..", ".registry")

    @staticmethod
    async def _get_author_details_cache() -> dict[str, registry_types.AuthorDetails]:
        if RegistryService._author_details_cache is not None:
            return RegistryService._author_details_cache

        author_index_path = os.path.join(RegistryService.get_repository_path(), "authors", "index.json")
        content, hash_value = await files.read_and_validate_schema_with_hash(
            author_index_path, registry_types.AuthorIndex
        )
        if hash_value == RegistryService._author_details_hash and RegistryService._author_details_cache is not None:
            return RegistryService._author_details_cache

        RegistryService._author_details_hash = hash_value

        author_details_cache: dict[str, registry_types.AuthorDetails] = {}
        for author in content.authors:
            if not author.author_id.lower():
                continue

            author_details_cache[author.author_id.lower()] = registry_types.AuthorDetails(
                author_id=author.author_id,
                author_alias=author.author_alias,
                attribution_link=author.attribution_link,
                contributor_tier=author.contributor_tier,
                attribution_method=author.attribution_method,
            )

        RegistryService._author_details_cache = author_details_cache
        return RegistryService._author_details_cache

    @staticmethod
    async def _get_integrity_index(asset_type: str) -> IntegrityReport:
        if asset_type == "map":
            if not RegistryService._index_cache["map"][0] and RegistryService._index_cache["map"][1] is not None:
                return RegistryService._index_cache["map"][1]
        elif asset_type == "mod":
            if not RegistryService._index_cache["mod"][0] and RegistryService._index_cache["mod"][1] is not None:
                return RegistryService._index_cache["mod"][1]
        else:
            raise ValueError(f"Invalid asset type: {asset_type}")

        integrity_index_path = os.path.join(RegistryService.get_repository_path(), f"{asset_type}s", "integrity.json")
        try:
            integrity_report = await files.read_and_validate_schema(integrity_index_path, IntegrityReport)
            if asset_type == "map":
                RegistryService._index_cache["map"][1] = integrity_report
                RegistryService._index_cache["map"][0] = True
            else:
                RegistryService._index_cache["mod"][1] = integrity_report
                RegistryService._index_cache["mod"][0] = True
            return integrity_report
        except FileNotFoundError:
            logger.error(f"Integrity index file not found for asset type {asset_type} in registry repository")
            raise
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in integrity index file for asset type {asset_type} in registry repository")
            raise
        except Exception as error:
            logger.error(
                f"Error loading integrity index for asset type {asset_type} in registry repository: {str(error)}"
            )
            raise

    @staticmethod
    async def get_author_info(author_id: str) -> registry_types.AuthorDetails:
        try:
            author_details_cache = await RegistryService._get_author_details_cache()
            author_details = author_details_cache.get(author_id)
            if author_details is None:
                raise ValueError(f"Author with ID {author_id} not found")
            return author_details
        except FileNotFoundError:
            logger.error("Author index file not found in registry repository")
            raise
        except json.JSONDecodeError:
            logger.error("Invalid JSON in author index file in registry repository")
            raise
        except KeyError:
            logger.error("Author index file has an unexpected structure in registry repository")
            raise

    @staticmethod
    async def get_author_info_with_assets(author_id: str) -> registry_types.AuthorResponse:
        author_details = await RegistryService.get_author_info(author_id)

        map_ids = []
        mod_ids = []

        maps_path = os.path.join(RegistryService.get_repository_path(), "maps")
        mods_path = os.path.join(RegistryService.get_repository_path(), "mods")

        for asset_type, path, id_list in [("map", maps_path, map_ids), ("mod", mods_path, mod_ids)]:
            try:
                for asset_id in os.listdir(path):
                    manifest_path = os.path.join(path, asset_id, "manifest.json")
                    if not os.path.isfile(manifest_path):
                        continue

                    try:
                        manifest_data = await files.read_and_validate_schema(
                            manifest_path,
                            MapManifest if asset_type == "map" else ModManifest,
                        )
                        if manifest_data.author.lower() == author_id:
                            id_list.append(asset_id)
                    except Exception as e:
                        logger.error(f"Error reading manifest for {asset_type} {asset_id}: {str(e)}")
            except FileNotFoundError:
                logger.error(f"{asset_type.capitalize()} directory not found in registry repository")
                continue
            except Exception as e:
                logger.error(f"Error listing {asset_type} directory in registry repository: {str(e)}")
                continue

        return registry_types.AuthorResponse(
            author_id=author_details.author_id,
            author_alias=author_details.author_alias,
            attribution_link=author_details.attribution_link,
            contributor_tier=author_details.contributor_tier,
            map_ids=map_ids,
            mod_ids=mod_ids,
        )

    @staticmethod
    def continuous_registry_update() -> None:
        if os.path.exists(RegistryService.get_repository_path()):
            logger.info("Already found registry repository")
            repo = git.Repo(RegistryService.get_repository_path())
            while True:
                logger.info("Pulling latest changes from registry repository")
                repo.remotes.origin.pull(depth=1)
                time.sleep(60 * 60)  # Check for updates every hour
        else:
            repo = git.Repo.clone_from(
                "https://github.com/Subway-Builder-Modded/registry.git",
                RegistryService.get_repository_path(),
                multi_options=["--depth=1"],
            )
            while True:
                logger.info("Pulling latest changes from registry repository")
                commits = repo.remotes.origin.pull(depth=1)
                for commit in commits:
                    for changed_file in commit.commit.stats.files:
                        if changed_file.endswith("integrity.json"):
                            if "maps" in changed_file:
                                RegistryService._map_integrity_index_changed = True
                                logger.info("Map integrity index has changed, will reload on next request")
                            elif "mods" in changed_file:
                                RegistryService._mod_integrity_index_changed = True
                                logger.info("Mod integrity index has changed, will reload on next request")
                            break
                time.sleep(60 * 60)  # Check for updates every hour

    @staticmethod
    def _build_update_config(
        manifest_data: MapManifest | ModManifest,
    ) -> Update | Update1:
        update_data = manifest_data.update
        return UpdateConfig(
            type=update_data.type,
            repo=update_data.repo,
            url=update_data.url,
        )

    @staticmethod
    def _build_initial_view_state(
        manifest_data: MapManifest | ModManifest,
    ) -> InitialViewState:
        initial_view_state = manifest_data.initial_view_state
        return InitialViewState(
            latitude=initial_view_state.latitude,
            longitude=initial_view_state.longitude,
            zoom=initial_view_state.zoom,
            pitch=initial_view_state.pitch,
            bearing=initial_view_state.bearing,
        )

    @staticmethod
    async def get_asset_manifest(asset_id: str, asset_type: str) -> MapManifest | ModManifest:
        manifest_path = os.path.join(
            RegistryService.get_repository_path(), f"{asset_type}s", f"{asset_id}", "manifest.json"
        )
        try:
            type_to_use = MapManifest if asset_type == "map" else ModManifest
            manifest_data = await files.read_and_validate_schema(manifest_path, type_to_use)
        except FileNotFoundError:
            logger.error(f"Manifest file not found for asset {asset_id} of type {asset_type}")
            raise
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in manifest file for asset {asset_id} of type {asset_type}")
            raise

        return manifest_data

    @staticmethod
    async def get_asset_versions(asset_id: str, asset_type: str) -> dict[str, IntegrityVersionInfo]:
        manifest = await RegistryService._get_integrity_index(asset_type)
        return manifest.listings[asset_id].versions

    @staticmethod
    async def get_gallery_image(asset_type: str, asset_id: str, image_name: str) -> bytes:
        image_path = os.path.join(
            RegistryService.get_repository_path(), f"{asset_type}s", f"{asset_id}", "gallery", image_name
        )
        try:
            async with aiofiles.open(image_path, "rb") as image_file:
                return await image_file.read()
        except FileNotFoundError:
            logger.error(f"Gallery image {image_name} not found for asset {asset_id} of type {asset_type}")
            raise
        except Exception as error:
            logger.error(
                f"Error loading gallery image {image_name} for asset {asset_id} of type {asset_type}: {str(error)}"
            )
            raise
