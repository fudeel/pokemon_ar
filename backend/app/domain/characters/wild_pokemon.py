# app/domain/characters/wild_pokemon.py

from __future__ import annotations

from datetime import datetime

from app.domain.characters.character import Character
from app.domain.world.geo_location import GeoLocation


class WildPokemon(Character):
    """
    Server-tracked rare wild pokemon, placed by admins and visible to all players
    in range. Common pokemon are generated client-side and are NOT modeled here.
    """

    def __init__(
        self,
        *,
        wild_id: int | None,
        species_id: int,
        species_name: str,
        level: int,
        current_hp: int,
        location: GeoLocation,
        is_active: bool,
        expires_at: datetime | None,
        created_at: datetime,
    ) -> None:
        super().__init__(wild_id, f"Wild {species_name} Lv{level}", location)
        self._species_id = species_id
        self._species_name = species_name
        self._level = level
        self._current_hp = current_hp
        self._is_active = is_active
        self._expires_at = expires_at
        self._created_at = created_at

    @property
    def kind(self) -> str:
        return "wild_pokemon"

    @property
    def is_player_controlled(self) -> bool:
        return False

    @property
    def species_id(self) -> int:
        return self._species_id

    @property
    def species_name(self) -> str:
        return self._species_name

    @property
    def level(self) -> int:
        return self._level

    @property
    def current_hp(self) -> int:
        return self._current_hp

    @property
    def is_active(self) -> bool:
        return self._is_active

    @property
    def expires_at(self) -> datetime | None:
        return self._expires_at

    @property
    def created_at(self) -> datetime:
        return self._created_at

    def is_expired(self, now: datetime) -> bool:
        return self._expires_at is not None and now >= self._expires_at
