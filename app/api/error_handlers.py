# app/api/error_handlers.py

from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core.exceptions import (
    AlreadyExistsError,
    AuthenticationError,
    AuthorizationError,
    DomainError,
    InsufficientResourcesError,
    NotFoundError,
    OutOfRangeError,
    ValidationError,
)


_STATUS_MAP: dict[type[Exception], int] = {
    AuthenticationError: status.HTTP_401_UNAUTHORIZED,
    AuthorizationError: status.HTTP_403_FORBIDDEN,
    NotFoundError: status.HTTP_404_NOT_FOUND,
    AlreadyExistsError: status.HTTP_409_CONFLICT,
    ValidationError: status.HTTP_400_BAD_REQUEST,
    OutOfRangeError: status.HTTP_409_CONFLICT,
    InsufficientResourcesError: status.HTTP_409_CONFLICT,
}


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def handle_domain_error(_request: Request, exc: DomainError) -> JSONResponse:
        for exc_type, http_status in _STATUS_MAP.items():
            if isinstance(exc, exc_type):
                return JSONResponse(
                    status_code=http_status,
                    content={"error": exc_type.__name__, "detail": str(exc)},
                )
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "DomainError", "detail": str(exc)},
        )
