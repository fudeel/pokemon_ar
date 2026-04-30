# app/api/routers/capture_router.py

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import container_dep, current_player
from app.api.presenters import pokemon_instance_to_model
from app.api.schemas.capture import CaptureRequest, CaptureResponse
from app.container import Container
from app.domain.characters.player import Player
from app.domain.world.geo_location import GeoLocation

router = APIRouter(prefix="/capture", tags=["capture"])


@router.post("/rare", response_model=CaptureResponse)
def attempt_rare_capture(
    payload: CaptureRequest,
    player: Player = Depends(current_player),
    container: Container = Depends(container_dep),
) -> CaptureResponse:
    location = GeoLocation(
        latitude=payload.player_location.latitude,
        longitude=payload.player_location.longitude,
    )
    outcome = container.capture_service.attempt_capture(
        player_id=player.id,
        rare_pokemon_id=payload.rare_pokemon_id,
        pokeball_item_id=payload.pokeball_item_id,
        player_location=location,
    )
    return CaptureResponse(
        success=outcome.success,
        rare_pokemon_id=outcome.rare_pokemon_id,
        pokemon_instance=pokemon_instance_to_model(outcome.pokemon_instance) if outcome.pokemon_instance else None,
        remaining_pokeballs=outcome.remaining_pokeballs,
    )
