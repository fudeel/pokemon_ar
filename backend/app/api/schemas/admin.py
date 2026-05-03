# app/api/schemas/admin.py

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.api.schemas.common import GeoLocationModel
from app.api.schemas.pokemon import BaseStatsModel, MoveModel


class MoveUpsertRequest(BaseModel):
    name: str
    type: str
    category: str  # physical | special | status
    power: int | None = None
    accuracy: int | None = None
    pp: int = Field(ge=1, le=40)


class LearnableMoveModel(BaseModel):
    move: MoveModel
    learn_level: int


class SpeciesMoveEntry(BaseModel):
    move_id: int = Field(ge=1)
    learn_level: int = Field(ge=1, le=100)


class SpeciesMovesSetRequest(BaseModel):
    moves: list[SpeciesMoveEntry]


class SpeciesUpsertRequest(BaseModel):
    id: int = Field(ge=1)
    name: str
    primary_type: str
    secondary_type: str | None = None
    base_stats: BaseStatsModel
    capture_rate: int = Field(ge=1, le=255)
    base_experience: int = Field(ge=0)
    is_starter: bool = False
    is_rare: bool = False


class MapObjectCreateRequest(BaseModel):
    kind: str
    name: str | None = None
    location: GeoLocationModel
    metadata: dict | None = None


class NpcCreateRequest(BaseModel):
    name: str
    role: str
    location: GeoLocationModel
    dialogue: str | None = None
    metadata: dict | None = None


class SpawnAreaPokemonEntry(BaseModel):
    species_id: int = Field(ge=1)
    spawn_chance: float = Field(ge=0.0, le=100.0)


class SpawnAreaCreateRequest(BaseModel):
    name: str
    center: GeoLocationModel
    radius_meters: float = Field(gt=0)
    pokemon: list[SpawnAreaPokemonEntry] = []


class SpawnAreaSetPokemonRequest(BaseModel):
    pokemon: list[SpawnAreaPokemonEntry]


class EventAreaCreateRequest(BaseModel):
    name: str
    description: str | None = None
    center: GeoLocationModel
    radius_meters: float = Field(gt=0)
    starts_at: datetime
    ends_at: datetime
    metadata: dict | None = None


class GymCreateRequest(BaseModel):
    name: str
    location: GeoLocationModel


class RareWildPokemonCreateRequest(BaseModel):
    species_id: int
    level: int = Field(ge=1, le=100)
    location: GeoLocationModel
    expires_at: datetime | None = None


class ItemUpsertRequest(BaseModel):
    name: str = Field(min_length=1)
    category: str
    description: str
    buy_price: int | None = Field(default=None, ge=0)
    sell_price: int | None = Field(default=None, ge=0)
    effect_value: int | None = None
    stackable: bool = True


class ItemModel(BaseModel):
    id: int
    name: str
    category: str
    description: str
    buy_price: int | None
    sell_price: int | None
    effect_value: int | None
    stackable: bool


class QuestObjectiveDraftModel(BaseModel):
    objective_type: str
    description: str = Field(min_length=1)
    target_quantity: int = Field(default=1, ge=1)
    target_item_id: int | None = None
    target_species_id: int | None = None
    target_pokemon_type: str | None = None
    target_npc_id: int | None = None
    target_lat: float | None = None
    target_lng: float | None = None
    target_radius_meters: float | None = Field(default=None, gt=0)
    target_level: int | None = Field(default=None, ge=1, le=100)


class QuestItemRewardDraftModel(BaseModel):
    item_id: int = Field(ge=1)
    quantity: int = Field(ge=1)


class QuestUpsertRequest(BaseModel):
    title: str = Field(min_length=1)
    description: str
    minimum_level: int = Field(default=1, ge=1, le=100)
    reward_pokecoins: int = Field(default=0, ge=0)
    reward_experience: int = Field(default=0, ge=0)
    time_limit_seconds: int | None = Field(default=None, gt=0)
    is_repeatable: bool = False
    follow_up_quest_id: int | None = None
    objectives: list[QuestObjectiveDraftModel] = Field(min_length=1)
    item_rewards: list[QuestItemRewardDraftModel] = []


class QuestObjectiveModel(BaseModel):
    id: int
    order: int
    objective_type: str
    description: str
    target_quantity: int
    target_item_id: int | None
    target_species_id: int | None
    target_pokemon_type: str | None
    target_npc_id: int | None
    target_lat: float | None
    target_lng: float | None
    target_radius_meters: float | None
    target_level: int | None


class QuestItemRewardModel(BaseModel):
    item_id: int
    item_name: str
    quantity: int


class QuestRewardModel(BaseModel):
    pokecoins: int
    experience: int
    items: list[QuestItemRewardModel]


class QuestModel(BaseModel):
    id: int
    title: str
    description: str
    minimum_level: int
    time_limit_seconds: int | None
    is_repeatable: bool
    follow_up_quest_id: int | None
    objectives: list[QuestObjectiveModel]
    reward: QuestRewardModel
