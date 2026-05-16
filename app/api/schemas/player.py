# app/api/schemas/player.py

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.api.schemas.common import GeoLocationModel
from app.api.schemas.pokemon import PokemonInstanceModel


class PlayerModel(BaseModel):
    id: int
    username: str
    email: str
    level: int
    experience: int
    pokecoins: int
    has_chosen_starter: bool
    location: GeoLocationModel | None
    last_seen_at: datetime | None
    created_at: datetime


class InventorySlotModel(BaseModel):
    item_id: int
    item_name: str
    category: str
    quantity: int


class PlayerProfileResponse(BaseModel):
    player: PlayerModel
    pokemon: list[PokemonInstanceModel]
    inventory: list[InventorySlotModel]
