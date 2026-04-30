# app/api/schemas/capture.py

from __future__ import annotations

from pydantic import BaseModel

from app.api.schemas.common import GeoLocationModel
from app.api.schemas.pokemon import PokemonInstanceModel


class CaptureRequest(BaseModel):
    rare_pokemon_id: int
    pokeball_item_id: int
    player_location: GeoLocationModel


class CaptureResponse(BaseModel):
    success: bool
    rare_pokemon_id: int
    pokemon_instance: PokemonInstanceModel | None
    remaining_pokeballs: int
