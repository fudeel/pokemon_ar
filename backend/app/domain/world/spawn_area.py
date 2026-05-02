# app/domain/world/spawn_area.py

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from app.domain.pokemon.pokemon_type import PokemonType
from app.domain.world.geo_location import GeoLocation


@dataclass(frozen=True, slots=True)
class SpawnAreaPokemon:
    """A species that can spawn inside a spawn area, with its probability."""

    species_id: int
    species_name: str
    spawn_chance: float  # 0–100 percent

    def __post_init__(self) -> None:
        if not (0.0 <= self.spawn_chance <= 100.0):
            raise ValueError("spawn_chance must be between 0 and 100")


@dataclass(frozen=True, slots=True)
class SpawnArea:
    """
    A circular zone placed by an admin. The client receives the area geometry
    and the explicit list of species (with their spawn chances) and uses that
    to drive local pokemon generation. The server does not spawn pokemon itself.
    """

    id: int | None
    name: str
    center: GeoLocation
    radius_meters: float
    # Legacy type fields kept for DB compatibility; logic now driven by pokemon list.
    primary_type: PokemonType
    secondary_type: PokemonType | None
    spawn_weight: float
    pokemon: list[SpawnAreaPokemon]
    created_at: datetime
    created_by_admin_id: int | None

    def __post_init__(self) -> None:
        if self.radius_meters <= 0:
            raise ValueError("radius_meters must be positive")
