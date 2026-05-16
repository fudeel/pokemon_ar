# app/domain/world/gym.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from app.domain.world.geo_location import GeoLocation


@dataclass(frozen=True, slots=True)
class GymDefender:
    slot: int
    pokemon_instance_id: int
    effective_level: int
    placed_at: datetime


@dataclass(frozen=True, slots=True)
class Gym:
    id: int | None
    name: str
    location: GeoLocation
    current_leader_player_id: int | None
    leader_since: datetime | None
    created_at: datetime
    created_by_admin_id: int | None
    defenders: tuple[GymDefender, ...]

    @property
    def has_leader(self) -> bool:
        return self.current_leader_player_id is not None
