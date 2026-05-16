# app/api/schemas/pokemon.py

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.api.schemas.common import GeoLocationModel


class BaseStatsModel(BaseModel):
    hp: int
    attack: int
    defense: int
    special_attack: int
    special_defense: int
    speed: int


class PokemonSpeciesModel(BaseModel):
    id: int
    name: str
    primary_type: str
    secondary_type: str | None
    base_stats: BaseStatsModel
    capture_rate: int
    base_experience: int
    is_starter: bool
    is_rare: bool


class MoveModel(BaseModel):
    id: int
    name: str
    type: str
    category: str
    power: int | None
    accuracy: int | None
    pp: int


class EquippedMoveModel(BaseModel):
    slot: int
    move: MoveModel
    current_pp: int


class IndividualValuesModel(BaseModel):
    hp: int
    attack: int
    defense: int
    special_attack: int
    special_defense: int
    speed: int


class EffectiveStatsModel(BaseModel):
    max_hp: int
    attack: int
    defense: int
    special_attack: int
    special_defense: int
    speed: int


class PokemonInstanceModel(BaseModel):
    id: int
    species: PokemonSpeciesModel
    owner_player_id: int | None
    nickname: str | None
    level: int
    experience: int
    current_hp: int
    effective_stats: EffectiveStatsModel
    ivs: IndividualValuesModel
    moves: list[EquippedMoveModel]
    caught_at: datetime
    caught_location: GeoLocationModel | None
    nerfs: dict[str, bool | None]
