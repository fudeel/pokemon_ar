# app/domain/world/event_area.py

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from app.domain.world.geo_location import GeoLocation
from app.domain.world.polygon import (
    bounding_radius_meters,
    centroid,
    validate_polygon,
)


@dataclass(frozen=True, slots=True)
class EventArea:
    """A time-bounded polygonal zone (festival, double XP, special spawns, etc.)."""

    id: int | None
    name: str
    description: str | None
    polygon: tuple[GeoLocation, ...]
    starts_at: datetime
    ends_at: datetime
    metadata: dict
    created_at: datetime
    created_by_admin_id: int | None
    center: GeoLocation = field(init=False)
    radius_meters: float = field(init=False)

    def __post_init__(self) -> None:
        validate_polygon(self.polygon)
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be strictly after starts_at")
        c = centroid(self.polygon)
        object.__setattr__(self, "center", c)
        object.__setattr__(self, "radius_meters", bounding_radius_meters(self.polygon, c))

    def is_active_at(self, instant: datetime) -> bool:
        return self.starts_at <= instant < self.ends_at
