# app/domain/characters/stats.py

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class BaseStats:
    """Immutable per-species stat block, mirroring classic Pokemon stat layout."""

    hp: int
    attack: int
    defense: int
    special_attack: int
    special_defense: int
    speed: int


@dataclass(frozen=True, slots=True)
class IndividualValues:
    """Per-instance random stat modifiers (0-31), set at creation."""

    hp: int
    attack: int
    defense: int
    special_attack: int
    special_defense: int
    speed: int

    def __post_init__(self) -> None:
        for value in (
            self.hp,
            self.attack,
            self.defense,
            self.special_attack,
            self.special_defense,
            self.speed,
        ):
            if not 0 <= value <= 31:
                raise ValueError(f"IV value {value} out of range 0..31")


@dataclass(frozen=True, slots=True)
class EffectiveStats:
    """Stats actually used for combat, computed from base + IV + level."""

    max_hp: int
    attack: int
    defense: int
    special_attack: int
    special_defense: int
    speed: int


class StatCalculator:
    """Pure-function stat calculator following Gen-3+ formulas (no EVs, no nature)."""

    @staticmethod
    def compute(base: BaseStats, ivs: IndividualValues, level: int) -> EffectiveStats:
        if level < 1 or level > 100:
            raise ValueError("level out of range")

        max_hp = ((2 * base.hp + ivs.hp) * level) // 100 + level + 10

        def other(base_value: int, iv: int) -> int:
            return ((2 * base_value + iv) * level) // 100 + 5

        return EffectiveStats(
            max_hp=max_hp,
            attack=other(base.attack, ivs.attack),
            defense=other(base.defense, ivs.defense),
            special_attack=other(base.special_attack, ivs.special_attack),
            special_defense=other(base.special_defense, ivs.special_defense),
            speed=other(base.speed, ivs.speed),
        )
