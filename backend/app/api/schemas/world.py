# app/api/schemas/world.py

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.api.schemas.common import GeoLocationModel


class WorldSnapshotRequest(BaseModel):
    location: GeoLocationModel
    radius_meters: float | None = Field(default=None, gt=0)


class MapObjectModel(BaseModel):
    id: int
    kind: str
    name: str | None
    location: GeoLocationModel
    metadata: dict


class NpcModel(BaseModel):
    id: int
    name: str
    role: str
    location: GeoLocationModel
    dialogue: str | None
    metadata: dict
    merchant_id: int | None = None


class MerchantItemModel(BaseModel):
    item_id: int
    item_name: str
    item_category: str
    base_buy_price: int | None
    price_override: int | None
    effective_price: int


class MerchantModel(BaseModel):
    id: int
    name: str
    description: str | None
    items: list[MerchantItemModel]


class PurchaseLineRequest(BaseModel):
    item_id: int = Field(ge=1)
    quantity: int = Field(ge=1)


class PurchaseRequest(BaseModel):
    location: GeoLocationModel
    lines: list[PurchaseLineRequest] = Field(min_length=1)


class PurchaseLineResultModel(BaseModel):
    item_id: int
    item_name: str
    quantity: int
    unit_price: int
    line_total: int


class PurchaseReceiptModel(BaseModel):
    npc_id: int
    merchant_id: int
    lines: list[PurchaseLineResultModel]
    total_cost: int
    pokecoins_after: int


class SpawnAreaPokemonModel(BaseModel):
    species_id: int
    species_name: str
    spawn_chance: float


class SpawnAreaItemModel(BaseModel):
    item_id: int
    item_name: str
    item_category: str
    spawn_chance: float
    max_quantity: int


class SpawnAreaModel(BaseModel):
    id: int
    name: str
    polygon: list[GeoLocationModel]
    center: GeoLocationModel
    radius_meters: float
    pokemon: list[SpawnAreaPokemonModel]
    items: list[SpawnAreaItemModel]


class EventAreaModel(BaseModel):
    id: int
    name: str
    description: str | None
    polygon: list[GeoLocationModel]
    center: GeoLocationModel
    radius_meters: float
    starts_at: datetime
    ends_at: datetime
    metadata: dict


class GymDefenderModel(BaseModel):
    slot: int
    pokemon_instance_id: int
    effective_level: int


class GymModel(BaseModel):
    id: int
    name: str
    location: GeoLocationModel
    current_leader_player_id: int | None
    leader_since: datetime | None
    defenders: list[GymDefenderModel]


class WildPokemonModel(BaseModel):
    id: int
    species_id: int
    species_name: str
    level: int
    current_hp: int
    location: GeoLocationModel
    expires_at: datetime | None


class WorldItemSpawnModel(BaseModel):
    id: int
    item_id: int
    item_name: str
    item_category: str
    quantity: int
    location: GeoLocationModel
    is_hidden: bool
    expires_at: datetime | None


class ItemSpawnAreaItemModel(BaseModel):
    item_id: int
    item_name: str
    item_category: str
    spawn_chance: float
    max_quantity: int


class ItemSpawnAreaModel(BaseModel):
    id: int
    name: str
    polygon: list[GeoLocationModel]
    center: GeoLocationModel
    radius_meters: float
    items: list[ItemSpawnAreaItemModel]


class WorldSnapshotResponse(BaseModel):
    generated_at: datetime
    center: GeoLocationModel
    radius_meters: float
    map_objects: list[MapObjectModel]
    npcs: list[NpcModel]
    spawn_areas: list[SpawnAreaModel]
    event_areas: list[EventAreaModel]
    gyms: list[GymModel]
    rare_wild_pokemon: list[WildPokemonModel]
    world_item_spawns: list[WorldItemSpawnModel]
    item_spawn_areas: list[ItemSpawnAreaModel]
