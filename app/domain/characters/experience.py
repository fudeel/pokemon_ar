# app/domain/characters/experience.py

from __future__ import annotations


class ExperienceTable:
    """
    Medium-fast experience curve (n^3) used by both players and pokemon.

    Centralized so level-up logic does not need to be duplicated.
    """

    MAX_LEVEL: int = 100

    @classmethod
    def total_experience_for_level(cls, level: int) -> int:
        if level < 1 or level > cls.MAX_LEVEL:
            raise ValueError(f"level {level} out of range")
        return level**3

    @classmethod
    def level_for_total_experience(cls, total_experience: int) -> int:
        if total_experience < 0:
            raise ValueError("experience cannot be negative")
        level = 1
        while level < cls.MAX_LEVEL and cls.total_experience_for_level(level + 1) <= total_experience:
            level += 1
        return level
