# app/api/deps.py

from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status

from app.container import Container, get_container
from app.core.exceptions import AuthenticationError
from app.domain.characters.player import Player


def container_dep() -> Container:
    return get_container()


def _extract_bearer(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing or malformed Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return authorization.split(" ", 1)[1].strip()


def current_player(
    authorization: str | None = Header(default=None),
    container: Container = Depends(container_dep),
) -> Player:
    token = _extract_bearer(authorization)
    try:
        return container.auth_service.authenticate_player_token(token)
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


def current_admin_id(
    authorization: str | None = Header(default=None),
    container: Container = Depends(container_dep),
) -> int:
    token = _extract_bearer(authorization)
    try:
        return container.auth_service.authenticate_admin_token(token)
    except AuthenticationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
