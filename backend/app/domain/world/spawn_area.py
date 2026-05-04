# app/domain/world/spawn_area.py

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from app.domain.pokemon.pokemon_type import PokemonType
from app.domain.world.geo_location import GeoLocation
from app.domain.world.polygon import (
    bounding_radius_meters,
    centroid,
    validate_polygon,
)


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
    A polygonal zone placed by an admin. The client receives the polygon plus
    the explicit list of species (with their spawn chances) and uses that to
    drive local pokemon generation. The server does not spawn pokemon itself.

    `center` and `radius_meters` are derived from the polygon (centroid + the
    distance to the farthest vertex) and exposed for bbox indexing and as a
    convenience for older clients.
    """

    id: int | None
    name: str
    polygon: tuple[GeoLocation, ...]
    center: GeoLocation = field(init=False)
    radius_meters: float = field(init=False)
    primary_type: PokemonType = PokemonType.NORMAL
    secondary_type: PokemonType | None = None
    spawn_weight: float = 1.0
    pokemon: list[SpawnAreaPokemon] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    created_by_admin_id: int | None = None

    def __post_init__(self) -> None:
        validate_polygon(self.polygon)
        c = centroid(self.polygon)
        object.__setattr__(self, "center", c)
        object.__setattr__(self, "radius_meters", bounding_radius_meters(self.polygon, c))
