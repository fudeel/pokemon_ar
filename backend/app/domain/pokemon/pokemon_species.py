# app/domain/pokemon/pokemon_species.py

from __future__ import annotations

from dataclasses import dataclass

from app.domain.characters.stats import BaseStats
from app.domain.pokemon.pokemon_type import PokemonType


@dataclass(frozen=True, slots=True)
class PokemonSpecies:
    """Immutable species template (admin-maintained, used to instantiate pokemon)."""

    id: int
    name: str
    primary_type: PokemonType
    secondary_type: PokemonType | None
    base_stats: BaseStats
    capture_rate: int
    base_experience: int
    is_starter: bool
    is_rare: bool

    def __post_init__(self) -> None:
        if not 1 <= self.capture_rate <= 255:
            raise ValueError("capture_rate must be 1..255")
        if self.base_experience < 0:
            raise ValueError("base_experience must be non-negative")
