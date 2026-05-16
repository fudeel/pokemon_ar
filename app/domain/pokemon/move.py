# app/domain/pokemon/move.py

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from app.domain.pokemon.pokemon_type import PokemonType


class MoveCategory(StrEnum):
    PHYSICAL = "physical"
    SPECIAL = "special"
    STATUS = "status"


@dataclass(frozen=True, slots=True)
class Move:
    id: int
    name: str
    type: PokemonType
    category: MoveCategory
    power: int | None
    accuracy: int | None
    pp: int


@dataclass(frozen=True, slots=True)
class LearnableMove:
    move: Move
    learn_level: int


@dataclass(slots=True)
class EquippedMove:
    """A move actually attached to a pokemon instance, with its current PP state."""

    move: Move
    slot: int
    current_pp: int

    def consume_pp(self) -> None:
        if self.current_pp <= 0:
            raise ValueError("no PP remaining")
        self.current_pp -= 1
