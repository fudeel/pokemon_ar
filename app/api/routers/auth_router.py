# app/api/routers/auth_router.py

from __future__ import annotations

from fastapi import APIRouter, Depends, Header

from app.api.deps import container_dep, current_player
from app.api.presenters import player_to_model
from app.api.schemas.auth import (
    PlayerLoginRequest,
    PlayerLoginResponse,
    PlayerRegistrationRequest,
)
from app.api.schemas.player import PlayerModel
from app.container import Container
from app.domain.characters.player import Player

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=PlayerModel, status_code=201)
def register_player(
    payload: PlayerRegistrationRequest,
    container: Container = Depends(container_dep),
) -> PlayerModel:
    player = container.auth_service.register_player(
        username=payload.username, email=payload.email, password=payload.password
    )
    return player_to_model(player)


@router.post("/login", response_model=PlayerLoginResponse)
def login_player(
    payload: PlayerLoginRequest,
    container: Container = Depends(container_dep),
) -> PlayerLoginResponse:
    player, issued = container.auth_service.login_player(
        username=payload.username, password=payload.password
    )
    return PlayerLoginResponse(
        token=issued.token,
        expires_at=issued.expires_at,
        player_id=player.id,
        username=player.username,
        has_chosen_starter=player.has_chosen_starter,
    )


@router.post("/logout", status_code=204)
def logout_player(
    authorization: str = Header(...),
    container: Container = Depends(container_dep),
    _player: Player = Depends(current_player),
) -> None:
    container.auth_service.logout_player(authorization.split(" ", 1)[1].strip())
