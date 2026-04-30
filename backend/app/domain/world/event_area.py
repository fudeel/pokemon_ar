# app/domain/world/event_area.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from app.domain.world.geo_location import GeoLocation


@dataclass(frozen=True, slots=True)
class EventArea:
    """A time-bounded zone (festival, double XP, special spawns, etc.)."""

    id: int | None
    name: str
    description: str | None
    center: GeoLocation
    radius_meters: float
    starts_at: datetime
    ends_at: datetime
    metadata: dict
    created_at: datetime
    created_by_admin_id: int | None

    def __post_init__(self) -> None:
        if self.radius_meters <= 0:
            raise ValueError("radius_meters must be positive")
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be strictly after starts_at")

    def is_active_at(self, instant: datetime) -> bool:
        return self.starts_at <= instant < self.ends_at
