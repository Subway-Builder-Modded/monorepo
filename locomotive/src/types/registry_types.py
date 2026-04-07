from typing import Dict, List, Optional

from pydantic import BaseModel


class AuthorDetails(BaseModel):
    author_id: str
    author_alias: Optional[str] = None
    attribution_link: Optional[str] = None
    contributor_tier: Optional[str] = None


class UpdateConfig(BaseModel):
    type: str
    repo: Optional[str] = None
    url: Optional[str] = None


class AssetManifest(BaseModel):
    schema_version: int
    id: str
    name: str
    author: AuthorDetails | str
    github_id: int
    last_updated: Optional[int] = None
    description: str
    tags: List[str]
    gallery: List[str]
    source: str
    update: UpdateConfig
    is_test: bool


class InitialViewState(BaseModel):
    latitude: float
    longitude: float
    zoom: float
    pitch: Optional[float] = None
    bearing: float


class MapManifest(AssetManifest):
    city_code: str
    country: str
    location: str
    population: int
    data_source: str
    source_quality: str
    level_of_detail: str
    special_demand: List[str]
    initial_view_state: InitialViewState
    residents_total: int
    points_count: int
    population_count: int
    file_sizes: dict[str, float]
    grid_statistics: dict[str, dict[str, float] | object]


class VersionInfo(BaseModel):
    version: str
    name: str
    changelog: str
    date: str
    download_url: str
    game_version: str
    sha256: str
    downloads: int
    manifest: str
    prerelease: bool
    dependencies: Dict[str, str]


class GithubAsset(BaseModel):
    name: str
    browser_download_url: str
    download_count: int


class GithubRelease(BaseModel):
    tag_name: str
    name: str
    body: str
    prerelease: bool
    published_at: str
    assets: List[GithubAsset]


class AuthorIndexEntry(BaseModel):
    github_id: int
    author_id: str
    author_alias: Optional[str] = None
    attribution_method: Optional[str] = None
    attribution_link: Optional[str] = None
    ko_fi_username: Optional[str] = None
    contributor_tier: Optional[str] = None
    discord_id: Optional[str] = None
    discord_username: Optional[str] = None


class AuthorIndex(BaseModel):
    schema_version: int
    authors: List[AuthorIndexEntry]
