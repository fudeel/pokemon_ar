# app/domain/characters/player.py

from __future__ import annotations

from datetime import datetime

from app.domain.characters.character import Character
from app.domain.characters.experience import ExperienceTable
from app.domain.world.geo_location import GeoLocation


class Player(Character):
    """A human-controlled trainer."""

    def __init__(
        self,
        *,
        player_id: int | None,
        username: str,
        email: str,
        level: int,
        experience: int,
        pokecoins: int,
        has_chosen_starter: bool,
        location: GeoLocation | None,
        last_seen_at: datetime | None,
        created_at: datetime,
    ) -> None:
        super().__init__(player_id, username, location)
        self._email = email
        self._level = level
        self._experience = experience
        self._pokecoins = pokecoins
        self._has_chosen_starter = has_chosen_starter
        self._last_seen_at = last_seen_at
        self._created_at = created_at

    @property
    def kind(self) -> str:
        return "player"

    @property
    def is_player_controlled(self) -> bool:
        return True

    @property
    def username(self) -> str:
        return self._display_name

    @property
    def email(self) -> str:
        return self._email

    @property
    def level(self) -> int:
        return self._level

    @property
    def experience(self) -> int:
        return self._experience

    @property
    def pokecoins(self) -> int:
        return self._pokecoins

    @property
    def has_chosen_starter(self) -> bool:
        return self._has_chosen_starter

    @property
    def last_seen_at(self) -> datetime | None:
        return self._last_seen_at

    @property
    def created_at(self) -> datetime:
        return self._created_at

    def grant_experience(self, amount: int) -> int:
        if amount < 0:
            raise ValueError("experience grant must be non-negative")
        self._experience += amount
        new_level = ExperienceTable.level_for_total_experience(self._experience)
        levels_gained = new_level - self._level
        self._level = new_level
        return levels_gained

    def adjust_pokecoins(self, delta: int) -> None:
        new_balance = self._pokecoins + delta
        if new_balance < 0:
            raise ValueError("pokecoin balance cannot go negative")
        self._pokecoins = new_balance
