# app/services/starter_service.py

from __future__ import annotations

from datetime import datetime, timezone

from app.core.exceptions import DomainError, NotFoundError
from app.domain.pokemon.move import EquippedMove
from app.domain.pokemon.pokemon_instance import PokemonInstance
from app.domain.pokemon.pokemon_species import PokemonSpecies
from app.repositories.move_repository import MoveRepository
from app.repositories.player_repository import PlayerRepository
from app.repositories.pokemon_instance_repository import PokemonInstanceRepository
from app.repositories.pokemon_species_repository import PokemonSpeciesRepository

STARTER_LEVEL = 5
MAX_STARTER_MOVES = 4


class StarterService:
    """Handles the one-time starter selection at the beginning of a player's adventure."""

    def __init__(
        self,
        *,
        player_repository: PlayerRepository,
        species_repository: PokemonSpeciesRepository,
        instance_repository: PokemonInstanceRepository,
        move_repository: MoveRepository,
    ) -> None:
        self._players = player_repository
        self._species = species_repository
        self._instances = instance_repository
        self._moves = move_repository

    def list_starters(self) -> list[PokemonSpecies]:
        return self._species.list_starters()

    def choose_starter(self, *, player_id: int, species_id: int) -> PokemonInstance:
        player = self._players.get_by_id(player_id)
        if player.has_chosen_starter:
            raise DomainError("player has already chosen a starter")
        species = self._species.get_by_id(species_id)
        if not species.is_starter:
            raise DomainError(f"species {species.name} is not a starter")

        starter = self._build_starter(player_id, species)
        starter = self._instances.insert(starter)
        self._players.mark_starter_chosen(player_id)
        return starter

    def _build_starter(self, player_id: int, species: PokemonSpecies) -> PokemonInstance:
        ivs = PokemonInstance.roll_random_ivs()
        learnable = self._moves.list_learnable_for_species(species.id, max_level=STARTER_LEVEL)
        if not learnable:
            raise NotFoundError(f"no learnable moves defined for species {species.id}")
        chosen = learnable[-MAX_STARTER_MOVES:]
        equipped = [
            EquippedMove(move=item.move, slot=index + 1, current_pp=item.move.pp)
            for index, item in enumerate(chosen)
        ]

        instance = PokemonInstance(
            id=None,
            species=species,
            owner_player_id=player_id,
            nickname=None,
            level=STARTER_LEVEL,
            experience=STARTER_LEVEL**3,
            current_hp=1,
            ivs=ivs,
            moves=equipped,
            caught_at=datetime.now(timezone.utc),
            caught_location=None,
        )
        instance.heal_full()
        return instance
