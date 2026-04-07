from pydantic import BaseModel
from typing import List, Dict, Optional

class AuthorDetails(BaseModel):
    AuthorID: str
    AuthorAlias: str
    AttributionLink: str
    ContributorTier: Optional[str] = None

class UpdateConfig(BaseModel):
    Type: str
    Repo: Optional[str] = None
    URL: Optional[str] = None

class AssetManifest(BaseModel):
    SchemaVersion: int
    ID: str
    Name: str
    Author: AuthorDetails
    GithubID: int
    LastUpdated: int
    Description: str
    Tags: List[str]
    Gallery: List[str]
    Source: str
    Update: UpdateConfig
    IsTest: bool

class InitialViewState(BaseModel):
    Latitude: float
    Longitude: float
    Zoom: float
    Pitch: Optional[float] = None
    Bearing: float

class MapManifest(BaseModel, AssetManifest):
    CityCode: str
    Country: str
    Location: str
    Population: int
    DataSource: str
    SourceQuality: str
    LevelOfDetail: str
    SpecialDemand: List[str]
    InitialViewState: InitialViewState

class VersionInfo(BaseModel):
    Version: str
    Name: str
    Changelog: str
    Date: str
    DownloadURL: str
    GameVersion: str
    SHA256: str
    Downloads: int
    Manifest: str
    Prerelease: bool
    Dependencies: Dict[str, str]

class GithubAsset(BaseModel):
    Name: str
    BrowserDownloadURL: str
    DownloadCount: int

class GithubRelease(BaseModel):
    TagName: str
    Name: str
    Body: str
    Prerelease: bool
    PublishedAt: str
    Assets: List[GithubAsset]

