# app/api/routers/player_router.py

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import container_dep, current_player
from app.api.presenters import (
    pokemon_instance_to_model,
    profile_to_response,
    species_to_model,
    world_item_spawn_to_model,
)
from app.api.schemas.common import GeoLocationModel
from app.api.schemas.player import PlayerProfileResponse
from app.api.schemas.pokemon import PokemonInstanceModel, PokemonSpeciesModel
from app.api.schemas.starter import StarterChoiceRequest
from app.api.schemas.world import WorldItemSpawnModel
from app.container import Container
from app.domain.characters.player import Player
from app.domain.world.geo_location import GeoLocation
from pydantic import BaseModel

router = APIRouter(prefix="/me", tags=["player"])


class CollectWorldItemRequest(BaseModel):
    world_item_spawn_id: int
    location: GeoLocationModel


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


@router.post("/collect-world-item", response_model=WorldItemSpawnModel)
def collect_world_item(
    payload: CollectWorldItemRequest,
    player: Player = Depends(current_player),
    container: Container = Depends(container_dep),
) -> WorldItemSpawnModel:
    spawn = container.world_item_collection_service.collect(
        player_id=player.id,
        spawn_id=payload.world_item_spawn_id,
        player_location=GeoLocation(
            latitude=payload.location.latitude,
            longitude=payload.location.longitude,
        ),
    )
    return world_item_spawn_to_model(spawn)


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
