# app/domain/world/world_item_spawn.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from app.domain.world.geo_location import GeoLocation


@dataclass(frozen=True, slots=True)
class WorldItemSpawn:
    """An admin-placed item visible in the world that players can walk up and collect.

    When is_hidden is True, the client renders the spawn as a mystery box and
    only reveals the item identity once the player collects it.
    """

    id: int
    item_id: int
    item_name: str
    item_category: str
    quantity: int
    location: GeoLocation
    is_active: bool
    is_hidden: bool
    expires_at: datetime | None
    created_at: datetime
