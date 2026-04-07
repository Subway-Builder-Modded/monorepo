from contextlib import asynccontextmanager
from threading import Thread

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from . import registry, routers, shared


@asynccontextmanager
async def lifespan(app: FastAPI):
    repository_sync = Thread(target=registry.RegistryService.continuous_registry_update)
    repository_sync.daemon = True
    repository_sync.start()
    yield


app = FastAPI(lifespan=lifespan)

app.state.limiter = shared.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.include_router(routers.registry)
