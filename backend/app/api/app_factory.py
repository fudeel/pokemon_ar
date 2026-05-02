# app/api/app_factory.py

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.error_handlers import install_error_handlers
from app.api.routers.admin_router import public_router as admin_public_router
from app.api.routers.admin_router import router as admin_router
from app.api.routers.auth_router import router as auth_router
from app.api.routers.capture_router import router as capture_router
from app.api.routers.player_router import router as player_router
from app.api.routers.world_router import router as world_router
from app.container import get_container


def create_app() -> FastAPI:
    app = FastAPI(title="Pokemon AR Backend", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:3001"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    install_error_handlers(app)

    @app.on_event("startup")
    def _startup() -> None:
        get_container()

    app.include_router(auth_router)
    app.include_router(player_router)
    app.include_router(world_router)
    app.include_router(capture_router)
    app.include_router(admin_public_router)
    app.include_router(admin_router)

    return app
