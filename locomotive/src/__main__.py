from contextlib import asynccontextmanager
from multiprocessing import Process

from fastapi import FastAPI

from . import registry, routers


@asynccontextmanager
async def lifespan(app: FastAPI):
    process = Process(target=registry.continuous_registry_update)
    process.start()
    yield
    process.terminate()


app = FastAPI(lifespan=lifespan)


app.include_router(routers.registry)
