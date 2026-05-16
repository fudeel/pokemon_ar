# app/domain/world/item_spawn_area.py

from __future__ import annotations

from dataclasses import dataclass, field

from app.domain.world.geo_location import GeoLocation
from app.domain.world.polygon import (
    bounding_radius_meters,
    centroid,
    validate_polygon,
)


@dataclass(frozen=True, slots=True)
class ItemSpawnAreaEntry:
    """One item slot inside a client-side item spawn zone."""

    item_id: int
    item_name: str
    item_category: str
    spawn_chance: float
    max_quantity: int


@dataclass(frozen=True, slots=True)
class ItemSpawnArea:
    """
    A polygonal geographic zone whose item configuration is downloaded by the
    client. The client generates item pickups locally using spawn_chance — no
    server round-trip for individual spawns, identical to how Pokémon spawn
    areas work.
    """

    id: int
    name: str
    polygon: tuple[GeoLocation, ...]
    items: tuple[ItemSpawnAreaEntry, ...]
    center: GeoLocation = field(init=False)
    radius_meters: float = field(init=False)

    def __post_init__(self) -> None:
        validate_polygon(self.polygon)
        c = centroid(self.polygon)
        object.__setattr__(self, "center", c)
        object.__setattr__(self, "radius_meters", bounding_radius_meters(self.polygon, c))
