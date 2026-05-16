# app/domain/world/map_object.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from app.domain.world.geo_location import GeoLocation


@dataclass(frozen=True, slots=True)
class MapObject:
    """Static, decorative or interactive (non-character) world object placed by an admin."""

    id: int | None
    kind: str
    name: str | None
    location: GeoLocation
    metadata: dict
    created_at: datetime
    created_by_admin_id: int | None
