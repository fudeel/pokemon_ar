# app/services/capture_service.py

from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timezone

from app.core.exceptions import (
    DomainError,
    InsufficientResourcesError,
    OutOfRangeError,
    ValidationError,
)
from app.domain.characters.wild_pokemon import WildPokemon
from app.domain.items.item import ItemCategory
from app.domain.pokemon.move import EquippedMove
from app.domain.pokemon.pokemon_instance import PokemonInstance
from app.domain.world.geo_location import GeoLocation
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.item_repository import ItemRepository
from app.repositories.move_repository import MoveRepository
from app.repositories.player_repository import PlayerRepository
from app.repositories.pokemon_instance_repository import PokemonInstanceRepository
from app.repositories.pokemon_species_repository import PokemonSpeciesRepository
from app.repositories.wild_pokemon_repository import WildPokemonRepository

MAX_MOVES_PER_POKEMON = 4


@dataclass(frozen=True, slots=True)
class CaptureOutcome:
    success: bool
    rare_pokemon_id: int
    pokemon_instance: PokemonInstance | None
    remaining_pokeballs: int


class CaptureService:
    """
    Server-side authoritative capture for rare wild pokemon. The client runs the
    encounter UI; on successful catch it calls this service which validates
    proximity, consumes the pokeball, rolls the actual capture chance, and
    persists the new pokemon instance owned by the player.
    """

    def __init__(
        self,
        *,
        player_repository: PlayerRepository,
        wild_repository: WildPokemonRepository,
        species_repository: PokemonSpeciesRepository,
        instance_repository: PokemonInstanceRepository,
        inventory_repository: InventoryRepository,
        item_repository: ItemRepository,
        move_repository: MoveRepository,
        capture_proximity_meters: float,
    ) -> None:
        self._players = player_repository
        self._wild = wild_repository
        self._species = species_repository
        self._instances = instance_repository
        self._inventory = inventory_repository
        self._items = item_repository
        self._moves = move_repository
        self._proximity = capture_proximity_meters

    def attempt_capture(
        self,
        *,
        player_id: int,
        rare_pokemon_id: int,
        pokeball_item_id: int,
        player_location: GeoLocation,
    ) -> CaptureOutcome:
        wild = self._wild.get_by_id(rare_pokemon_id)
        if not wild.is_active or wild.is_expired(datetime.now(timezone.utc)):
            raise DomainError("rare wild pokemon no longer available")

        if not player_location.is_within_meters(wild.location, self._proximity):
            raise OutOfRangeError("player too far from rare wild pokemon")

        ball = self._items.get_by_id(pokeball_item_id)
        if ball.category is not ItemCategory.POKEBALL:
            raise ValidationError(f"item {ball.name} is not a pokeball")
        if ball.effect_value is None or ball.effect_value <= 0:
            raise ValidationError(f"pokeball {ball.name} has no capture multiplier")

        inventory = self._inventory.get_for_player(player_id)
        if not inventory.has(ball.id, 1):
            raise InsufficientResourcesError(f"player has no {ball.name}")

        remaining = self._inventory.consume(player_id, ball.id, 1)
        catch_chance = self._compute_catch_probability(wild, ball.effect_value)
        roll = secrets.randbelow(1_000_000) / 1_000_000

        if roll >= catch_chance:
            return CaptureOutcome(
                success=False,
                rare_pokemon_id=rare_pokemon_id,
                pokemon_instance=None,
                remaining_pokeballs=remaining,
            )

        instance = self._materialize_capture(player_id, wild, player_location)
        self._wild.deactivate(wild.id)
        self._wild.record_capture(
            rare_pokemon_id=wild.id, player_id=player_id, pokemon_instance_id=instance.id
        )
        return CaptureOutcome(
            success=True,
            rare_pokemon_id=rare_pokemon_id,
            pokemon_instance=instance,
            remaining_pokeballs=remaining,
        )

    def _compute_catch_probability(self, wild: WildPokemon, ball_multiplier_percent: int) -> float:
        species = self._species.get_by_id(wild.species_id)
        max_hp_reference = max(wild.current_hp, 1)
        hp_factor = (3 * max_hp_reference - 2 * wild.current_hp) / (3 * max_hp_reference)
        ball_factor = ball_multiplier_percent / 100.0
        chance = (species.capture_rate / 255.0) * hp_factor * ball_factor
        return max(0.0, min(0.95, chance))

    def _materialize_capture(
        self, player_id: int, wild: WildPokemon, player_location: GeoLocation
    ) -> PokemonInstance:
        species = self._species.get_by_id(wild.species_id)
        ivs = PokemonInstance.roll_random_ivs()
        learnable = self._moves.list_learnable_for_species(species.id, max_level=wild.level)
        chosen = learnable[-MAX_MOVES_PER_POKEMON:]
        equipped = [
            EquippedMove(move=item.move, slot=index + 1, current_pp=item.move.pp)
            for index, item in enumerate(chosen)
        ]
        instance = PokemonInstance(
            id=None,
            species=species,
            owner_player_id=player_id,
            nickname=None,
            level=wild.level,
            experience=wild.level**3,
            current_hp=1,
            ivs=ivs,
            moves=equipped,
            caught_at=datetime.now(timezone.utc),
            caught_location=player_location,
        )
        instance.heal_full()
        return self._instances.insert(instance)
