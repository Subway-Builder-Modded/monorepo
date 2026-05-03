from typing import Literal

from pydantic import AnyUrl, constr

from .MapManifest import MapManifest, InitialViewState
from .ModManifest import ModManifest, Update, Update1
from .IntegrityIndex import Versions as IntegrityVersionInfo, IntegrityOutput as IntegrityReport

def UpdateConfig(type: Literal['github', 'custom'], repo: constr(pattern=r'^[^/]+\/[^/]+$') | None = None, url: AnyUrl | None = None) -> Update | Update1:
    if type == 'github':
        return Update(type=type, repo=repo)  # type: ignore
    elif type == 'custom':
        return Update1(type=type, url=url)  # type: ignore
    else:
        raise ValueError(f"Invalid update type: {type}")
