# app/domain/quests/objective_type.py

from __future__ import annotations

from enum import StrEnum


class QuestObjectiveType(StrEnum):
    """Quest objective categories, expressed in Pokemon-AR terms."""

    GATHER_ITEM = "gather_item"
    DEFEAT_WILD_POKEMON = "defeat_wild_pokemon"
    DEFEAT_TRAINER = "defeat_trainer"
    DELIVER_ITEM = "deliver_item"
    TALK_TO_NPC = "talk_to_npc"
    EXPLORE_AREA = "explore_area"
    CATCH_POKEMON = "catch_pokemon"
    ESCORT_NPC = "escort_npc"
    REACH_LEVEL = "reach_level"
