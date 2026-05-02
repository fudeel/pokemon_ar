# app/api/schemas/admin.py

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.api.schemas.common import GeoLocationModel
from app.api.schemas.pokemon import BaseStatsModel


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
