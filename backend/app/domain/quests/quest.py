# app/domain/quests/quest.py

from __future__ import annotations

from dataclasses import dataclass

from app.domain.quests.quest_objective import QuestObjective
from app.domain.quests.quest_reward import QuestReward


@dataclass(frozen=True, slots=True)
class Quest:
    """A quest definition the admin team designs and assigns to questgiver NPCs."""

    id: int
    title: str
    description: str
    minimum_level: int
    time_limit_seconds: int | None
    is_repeatable: bool
    follow_up_quest_id: int | None
    objectives: tuple[QuestObjective, ...]
    reward: QuestReward
