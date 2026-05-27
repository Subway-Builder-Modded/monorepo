from typing import Literal

from pydantic import AnyUrl, constr

from .IntegrityIndex import IntegrityOutput as IntegrityReport
from .IntegrityIndex import Versions as IntegrityVersionInfo
from .MapManifest import InitialViewState, MapManifest
from .ModManifest import ModManifest, Update, Update1


def UpdateConfig(
    type: Literal["github", "custom"], repo: constr(pattern=r"^[^/]+\/[^/]+$") | None = None, url: AnyUrl | None = None
) -> Update | Update1:
    if type == "github":
        return Update(type=type, repo=repo)  # type: ignore
    elif type == "custom":
        return Update1(type=type, url=url)  # type: ignore
    else:
        raise ValueError(f"Invalid update type: {type}")
