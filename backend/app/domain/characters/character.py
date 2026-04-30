# app/domain/characters/character.py

from __future__ import annotations

from abc import ABC, abstractmethod

from app.domain.world.geo_location import GeoLocation


class Character(ABC):
    """
    Abstract base for any 'alive' element of the game world.

    Characters can be controlled by a player or by the server (NPCs, wild rare
    pokemon). They share an identity, a name, a position in the world, and the
    ability to be queried for proximity to other characters.
    """

    def __init__(self, character_id: int | None, display_name: str, location: GeoLocation | None) -> None:
        self._id = character_id
        self._display_name = display_name
        self._location = location

    @property
    def id(self) -> int | None:
        return self._id

    @property
    def display_name(self) -> str:
        return self._display_name

    @property
    def location(self) -> GeoLocation | None:
        return self._location

    @property
    @abstractmethod
    def is_player_controlled(self) -> bool: ...

    @property
    @abstractmethod
    def kind(self) -> str: ...

    def is_within_meters_of(self, other_location: GeoLocation, radius_meters: float) -> bool:
        if self._location is None:
            return False
        return self._location.is_within_meters(other_location, radius_meters)
