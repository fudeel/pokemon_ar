# app/domain/characters/non_player_character.py

from __future__ import annotations

from enum import StrEnum

from app.domain.characters.character import Character
from app.domain.world.geo_location import GeoLocation


class NPCRole(StrEnum):
    MERCHANT = "merchant"
    HEALER = "healer"
    QUESTGIVER = "questgiver"
    TRAINER = "trainer"
    AUCTIONEER = "auctioneer"


class NonPlayerCharacter(Character):
    """A server-controlled character placed in the world by an admin."""

    def __init__(
        self,
        *,
        npc_id: int | None,
        name: str,
        role: NPCRole,
        location: GeoLocation,
        dialogue: str | None,
        metadata: dict | None,
    ) -> None:
        super().__init__(npc_id, name, location)
        self._role = role
        self._dialogue = dialogue
        self._metadata = metadata or {}

    @property
    def kind(self) -> str:
        return f"npc:{self._role.value}"

    @property
    def is_player_controlled(self) -> bool:
        return False

    @property
    def role(self) -> NPCRole:
        return self._role

    @property
    def dialogue(self) -> str | None:
        return self._dialogue

    @property
    def metadata(self) -> dict:
        return dict(self._metadata)
