import json
import os
import time

import git
from loguru import logger

from ..types import registry_types
from ..utils import files

class RegistryService:
    _author_details_cache: dict[str, registry_types.AuthorDetails] | None = None
    _author_details_hash: str | None = None

    _map_integrity_index_changed: bool = False
    _map_integrity_index: registry_types.IntegrityReport | None = None
    _mod_integrity_index_changed: bool = False
    _mod_integrity_index: registry_types.IntegrityReport | None = None

    @staticmethod
    def get_repository_path() -> str:
        return os.path.join(os.path.dirname(os.path.realpath(__file__)), "..", "..", ".registry")

    @staticmethod
    async def _get_author_details_cache() -> dict[str, registry_types.AuthorDetails]:
        if RegistryService._author_details_cache is not None:
            return RegistryService._author_details_cache

        author_index_path = os.path.join(RegistryService.get_repository_path(), "authors", "index.json")
        content, hash_value = await files.read_and_validate_schema_with_hash(author_index_path, registry_types.AuthorIndex)
        if hash_value == RegistryService._author_details_hash and RegistryService._author_details_cache is not None:
            return RegistryService._author_details_cache

        RegistryService._author_details_hash = hash_value

        author_details_cache: dict[str, registry_types.AuthorDetails] = {}
        for author in content.authors:
            if not author.author_id:
                continue

            author_details_cache[author.author_id] = registry_types.AuthorDetails(
                author_id=author.author_id,
                author_alias=author.author_alias,
                attribution_link=author.attribution_link,
                contributor_tier=author.contributor_tier,
            )

        RegistryService._author_details_cache = author_details_cache
        return RegistryService._author_details_cache

    @staticmethod
    async def _get_integrity_index(asset_type: str) -> registry_types.IntegrityReport:
        if asset_type == "map":
            if not RegistryService._map_integrity_index_changed and RegistryService._map_integrity_index is not None:
                return RegistryService._map_integrity_index
        elif asset_type == "mod":
            if not RegistryService._mod_integrity_index_changed and RegistryService._mod_integrity_index is not None:
                return RegistryService._mod_integrity_index
        else:
            raise ValueError(f"Invalid asset type: {asset_type}")

        integrity_index_path = os.path.join(RegistryService.get_repository_path(), f"{asset_type}s", "integrity.json")
        try:
            integrity_report = await files.read_and_validate_schema(integrity_index_path, registry_types.IntegrityReport)
            if asset_type == "map":
                RegistryService._map_integrity_index = integrity_report
                RegistryService._map_integrity_index_changed = False
            else:
                RegistryService._mod_integrity_index = integrity_report
                RegistryService._mod_integrity_index_changed = False
            return integrity_report
        except FileNotFoundError:
            logger.error(f"Integrity index file not found for asset type {asset_type} in registry repository")
            raise
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in integrity index file for asset type {asset_type} in registry repository")
            raise
        except Exception as error:
            logger.error(f"Error loading integrity index for asset type {asset_type} in registry repository: {str(error)}")
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
    def continuous_registry_update() -> None:
        if os.path.exists(RegistryService.get_repository_path()):
            logger.info("Already found registry repository")
            repo = git.Repo(RegistryService.get_repository_path())
            while True:
                logger.info("Pulling latest changes from registry repository")
                repo.remotes.origin.pull()
                time.sleep(60 * 60)  # Check for updates every hour
        else:
            repo = git.Repo.clone_from(
                "https://github.com/Subway-Builder-Modded/registry.git",
                RegistryService.get_repository_path(),
                multi_options=["--depth=1"],
            )
            while True:
                logger.info("Pulling latest changes from registry repository")
                commits = repo.remotes.origin.pull()
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
    def _build_update_config(manifest_data: registry_types.MapManifest | registry_types.AssetManifest) -> registry_types.UpdateConfig:
        update_data = manifest_data.update
        return registry_types.UpdateConfig(
            type=update_data.type,
            repo=update_data.repo,
            url=update_data.url,
        )

    @staticmethod
    def _build_initial_view_state(
        manifest_data: registry_types.MapManifest | registry_types.AssetManifest,
    ) -> registry_types.InitialViewState:
        initial_view_state = manifest_data.initial_view_state
        return registry_types.InitialViewState(
            latitude=initial_view_state.latitude,
            longitude=initial_view_state.longitude,
            zoom=initial_view_state.zoom,
            pitch=initial_view_state.pitch,
            bearing=initial_view_state.bearing,
        )

    @staticmethod
    async def get_asset_manifest(asset_id: str, asset_type: str) -> registry_types.AssetManifest:
        manifest_path = os.path.join(RegistryService.get_repository_path(), f"{asset_type}s", f"{asset_id}", "manifest.json")
        try:
            type_to_use = registry_types.MapManifest if asset_type == "map" else registry_types.AssetManifest
            manifest_data = await files.read_and_validate_schema(manifest_path, type_to_use)
        except FileNotFoundError:
            logger.error(f"Manifest file not found for asset {asset_id} of type {asset_type}")
            raise
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in manifest file for asset {asset_id} of type {asset_type}")
            raise

        try:
            author_details = await RegistryService.get_author_info(manifest_data.author)
        except FileNotFoundError:
            logger.error(f"Author index file not found while loading asset {asset_id} of type {asset_type}")
            raise
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in author index while loading asset {asset_id} of type {asset_type}")
            raise

        common_manifest_fields = {
            "schema_version": manifest_data.schema_version,
            "id": manifest_data.id,
            "name": manifest_data.name,
            "author": author_details,
            "github_id": manifest_data.github_id,
            "last_updated": manifest_data.last_updated,
            "description": manifest_data.description,
            "tags": manifest_data.tags,
            "gallery": manifest_data.gallery,
            "source": manifest_data.source,
            "update": RegistryService._build_update_config(manifest_data),
            "is_test": manifest_data.is_test,
        }

        try:
            if asset_type == "map":
                map_manifest_fields = {
                    **common_manifest_fields,
                    "city_code": manifest_data.city_code,
                    "country": manifest_data.country,
                    "location": manifest_data.location,
                    "population": manifest_data.population,
                    "data_source": manifest_data.data_source,
                    "source_quality": manifest_data.source_quality,
                    "level_of_detail": manifest_data.level_of_detail,
                    "special_demand": manifest_data.special_demand,
                    "initial_view_state": RegistryService._build_initial_view_state(manifest_data),
                    "residents_total": manifest_data.residents_total,
                    "points_count": manifest_data.points_count,
                    "population_count": manifest_data.population_count,
                    "file_sizes": manifest_data.file_sizes,
                    "grid_statistics": manifest_data.grid_statistics,
                }

                return registry_types.MapManifest(**map_manifest_fields)

            return registry_types.AssetManifest(**common_manifest_fields)
        except KeyError as error:
            logger.error(f"Manifest file for asset {asset_id} of type {asset_type} is missing required field: {error}")
            raise
        except Exception as error:
            logger.error(f"Error loading manifest for asset {asset_id} of type {asset_type}: {str(error)}")
            raise

    @staticmethod
    async def get_asset_versions(asset_id: str, asset_type: str) -> dict[str, registry_types.IntegrityVersionInfo]:
        manifest = await RegistryService._get_integrity_index(asset_type)
        return manifest.listings[asset_id].versions


get_repository_path = RegistryService.get_repository_path
continuous_registry_update = RegistryService.continuous_registry_update
get_author_info = RegistryService.get_author_info
get_asset_manifest = RegistryService.get_asset_manifest
get_asset_versions = RegistryService.get_asset_versions
