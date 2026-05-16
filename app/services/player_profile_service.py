# app/services/player_profile_service.py

from __future__ import annotations

from dataclasses import dataclass

from app.domain.characters.player import Player
from app.domain.items.inventory import Inventory
from app.domain.pokemon.pokemon_instance import PokemonInstance
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.player_repository import PlayerRepository
from app.repositories.pokemon_instance_repository import PokemonInstanceRepository


@dataclass(frozen=True, slots=True)
class PlayerProfile:
    player: Player
    pokemon: list[PokemonInstance]
    inventory: Inventory


class PlayerProfileService:
    """Aggregates the per-login data the client refreshes about its own player."""

    def __init__(
        self,
        *,
        player_repository: PlayerRepository,
        instance_repository: PokemonInstanceRepository,
        inventory_repository: InventoryRepository,
    ) -> None:
        self._players = player_repository
        self._instances = instance_repository
        self._inventory = inventory_repository

    def get_profile(self, player_id: int) -> PlayerProfile:
        return PlayerProfile(
            player=self._players.get_by_id(player_id),
            pokemon=self._instances.list_for_player(player_id),
            inventory=self._inventory.get_for_player(player_id),
        )
