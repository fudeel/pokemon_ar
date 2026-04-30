# app/domain/world/spawn_area.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from app.domain.pokemon.pokemon_type import PokemonType
from app.domain.world.geo_location import GeoLocation


@dataclass(frozen=True, slots=True)
class SpawnArea:
    """
    A circular zone that biases the client-side common spawn generator toward
    one or two pokemon types. The server merely tells the client which areas
    are active near them; the client does the spawning.
    """

    id: int | None
    name: str
    center: GeoLocation
    radius_meters: float
    primary_type: PokemonType
    secondary_type: PokemonType | None
    spawn_weight: float
    created_at: datetime
    created_by_admin_id: int | None

    def __post_init__(self) -> None:
        if self.radius_meters <= 0:
            raise ValueError("radius_meters must be positive")
        if self.spawn_weight <= 0:
            raise ValueError("spawn_weight must be positive")
