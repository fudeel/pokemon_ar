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


class CommonCaptureRequest(BaseModel):
    species_id: int
    level: int
    pokemon_current_hp: int
    pokemon_max_hp: int
    pokeball_item_id: int
    player_location: GeoLocationModel


class CommonCaptureResponse(BaseModel):
    success: bool
    pokemon_instance: PokemonInstanceModel | None
    remaining_pokeballs: int
