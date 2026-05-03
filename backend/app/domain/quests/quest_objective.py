# app/domain/quests/quest_objective.py

from __future__ import annotations

from dataclasses import dataclass

from app.domain.pokemon.pokemon_type import PokemonType
from app.domain.quests.objective_type import QuestObjectiveType
from app.domain.world.geo_location import GeoLocation


@dataclass(frozen=True, slots=True)
class QuestObjective:
    """A single goal inside a quest. Fields are nullable per objective type."""

    id: int
    quest_id: int
    order: int
    objective_type: QuestObjectiveType
    description: str
    target_quantity: int
    target_item_id: int | None
    target_species_id: int | None
    target_pokemon_type: PokemonType | None
    target_npc_id: int | None
    target_location: GeoLocation | None
    target_radius_meters: float | None
    target_level: int | None
