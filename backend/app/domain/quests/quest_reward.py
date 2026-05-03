# app/domain/quests/quest_reward.py

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class QuestItemReward:
    """A bag-item reward granted when a quest is completed."""

    item_id: int
    item_name: str
    quantity: int


@dataclass(frozen=True, slots=True)
class QuestReward:
    """Aggregate reward block for a quest."""

    pokecoins: int
    experience: int
    items: tuple[QuestItemReward, ...]
