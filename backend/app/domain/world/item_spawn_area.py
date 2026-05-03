# app/domain/world/item_spawn_area.py

from __future__ import annotations

from dataclasses import dataclass

from app.domain.world.geo_location import GeoLocation


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
    A geographic zone whose item configuration is downloaded by the client.
    The client generates item pickups locally using spawn_chance — no server
    round-trip for individual spawns, identical to how Pokémon spawn areas work.
    """

    id: int
    name: str
    center: GeoLocation
    radius_meters: float
    items: tuple[ItemSpawnAreaEntry, ...]
