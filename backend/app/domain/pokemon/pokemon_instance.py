# app/domain/pokemon/pokemon_instance.py

from __future__ import annotations

import secrets
from dataclasses import dataclass, field
from datetime import datetime

NERF_KEYS: tuple[str, ...] = (
    "venom_poison",
    "badly_poisoned",
    "burn",
    "paralysis",
    "freeze",
    "sleep",
    "confusion",
)


def default_nerfs() -> dict[str, bool | None]:
    return {key: None for key in NERF_KEYS}

from app.domain.characters.experience import ExperienceTable
from app.domain.characters.stats import EffectiveStats, IndividualValues, StatCalculator
from app.domain.pokemon.move import EquippedMove
from app.domain.pokemon.pokemon_species import PokemonSpecies
from app.domain.world.geo_location import GeoLocation


@dataclass(slots=True)
class PokemonInstance:
    """An owned, persisted pokemon. The species is its template; instance carries IVs, level, HP, moves."""

    id: int | None
    species: PokemonSpecies
    owner_player_id: int | None
    nickname: str | None
    level: int
    experience: int
    current_hp: int
    ivs: IndividualValues
    moves: list[EquippedMove]
    caught_at: datetime
    caught_location: GeoLocation | None
    nerfs: dict[str, bool | None] = field(default_factory=default_nerfs)

    @staticmethod
    def roll_random_ivs() -> IndividualValues:
        return IndividualValues(
            hp=secrets.randbelow(32),
            attack=secrets.randbelow(32),
            defense=secrets.randbelow(32),
            special_attack=secrets.randbelow(32),
            special_defense=secrets.randbelow(32),
            speed=secrets.randbelow(32),
        )

    @property
    def display_name(self) -> str:
        return self.nickname or self.species.name

    @property
    def effective_stats(self) -> EffectiveStats:
        return StatCalculator.compute(self.species.base_stats, self.ivs, self.level)

    @property
    def is_fainted(self) -> bool:
        return self.current_hp <= 0

    def heal_full(self) -> None:
        self.current_hp = self.effective_stats.max_hp
        for equipped in self.moves:
            equipped.current_pp = equipped.move.pp

    def grant_experience(self, amount: int) -> int:
        if amount < 0:
            raise ValueError("experience grant must be non-negative")
        self.experience += amount
        new_level = ExperienceTable.level_for_total_experience(self.experience)
        levels_gained = new_level - self.level
        if levels_gained > 0:
            previous_max = self.effective_stats.max_hp
            self.level = new_level
            new_max = self.effective_stats.max_hp
            self.current_hp = min(new_max, self.current_hp + (new_max - previous_max))
        return levels_gained
