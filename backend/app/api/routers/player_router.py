# app/api/routers/player_router.py

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import container_dep, current_player
from app.api.presenters import (
    pokemon_instance_to_model,
    profile_to_response,
    species_to_model,
)
from app.api.schemas.player import PlayerProfileResponse
from app.api.schemas.pokemon import PokemonInstanceModel, PokemonSpeciesModel
from app.api.schemas.starter import StarterChoiceRequest
from app.container import Container
from app.domain.characters.player import Player

router = APIRouter(prefix="/me", tags=["player"])


@router.get("/profile", response_model=PlayerProfileResponse)
def get_profile(
    player: Player = Depends(current_player),
    container: Container = Depends(container_dep),
) -> PlayerProfileResponse:
    profile = container.profile_service.get_profile(player.id)
    return profile_to_response(profile)


@router.get("/starters", response_model=list[PokemonSpeciesModel])
def list_starters(
    _player: Player = Depends(current_player),
    container: Container = Depends(container_dep),
) -> list[PokemonSpeciesModel]:
    return [species_to_model(s) for s in container.starter_service.list_starters()]


@router.post("/starter", response_model=PokemonInstanceModel, status_code=201)
def choose_starter(
    payload: StarterChoiceRequest,
    player: Player = Depends(current_player),
    container: Container = Depends(container_dep),
) -> PokemonInstanceModel:
    starter = container.starter_service.choose_starter(
        player_id=player.id, species_id=payload.species_id
    )
    return pokemon_instance_to_model(starter)
