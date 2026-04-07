from fastapi import APIRouter

from ..types import AssetManifest

router = APIRouter(prefix="/registry", tags=["registry"])

@router.get("/mods/{mod}", tags=["registry"])
async def get_mod(mod: str) -> AssetManifest:
    """Fetches mod information from the registry."""
    return AssetManifest(
        SchemaVersion=1,
        ID="example-mod",
        Name="Example Mod",
        Author={
            "AuthorID": "example-author",
            "AuthorAlias": "Example Author",
            "AttributionLink": "https://example.com/author",
            "ContributorTier": "Gold"
        },
        GithubID=123456,
        LastUpdated=1700000000,
        Description="This is an example mod.",
        Tags=["example", "mod"],
        Gallery=["https://example.com/image1.png", "https://example.com/image2.png"],
        Source="",
        Update={
            "Type": "github",
            "Repo": "example/example-repo",
        },
        IsTest=False
    )