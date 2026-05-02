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


class SpawnAreaPokemonModel(BaseModel):
    species_id: int
    species_name: str
    spawn_chance: float


class SpawnAreaModel(BaseModel):
    id: int
    name: str
    center: GeoLocationModel
    radius_meters: float
    pokemon: list[SpawnAreaPokemonModel]


class EventAreaModel(BaseModel):
    id: int
    name: str
    description: str | None
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
