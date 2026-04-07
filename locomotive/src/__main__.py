from contextlib import asynccontextmanager
from threading import Thread

from fastapi import FastAPI

from . import registry, routers


@asynccontextmanager
async def lifespan(app: FastAPI):
    process = Thread(target=registry.RegistryService.continuous_registry_update)
    process.daemon = True
    process.start()
    yield


app = FastAPI(lifespan=lifespan)


app.include_router(routers.registry)
