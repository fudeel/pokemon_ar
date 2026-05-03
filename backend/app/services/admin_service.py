# app/services/admin_service.py

from __future__ import annotations

from datetime import datetime

from app.core.exceptions import NotFoundError
from app.domain.characters.non_player_character import NonPlayerCharacter, NPCRole
from app.domain.characters.stats import BaseStats
from app.domain.characters.wild_pokemon import WildPokemon
from app.domain.pokemon.pokemon_species import PokemonSpecies
from app.domain.pokemon.pokemon_type import PokemonType
from app.domain.world.event_area import EventArea
from app.domain.world.geo_location import GeoLocation
from app.domain.world.gym import Gym
from app.domain.world.map_object import MapObject
from app.domain.world.spawn_area import SpawnArea
from app.domain.items.item import Item, ItemCategory, ItemEffect
from app.domain.pokemon.move import LearnableMove, Move, MoveCategory
from app.domain.quests.quest import Quest
from app.domain.world.item_spawn_area import ItemSpawnArea
from app.domain.world.world_item_spawn import WorldItemSpawn
from app.repositories.event_area_repository import EventAreaRepository
from app.repositories.gym_repository import GymRepository
from app.repositories.item_repository import ItemRepository
from app.repositories.map_object_repository import MapObjectRepository
from app.repositories.move_repository import MoveRepository
from app.repositories.npc_repository import NpcRepository
from app.repositories.pokemon_species_repository import PokemonSpeciesRepository
from app.repositories.item_spawn_area_repository import ItemSpawnAreaRepository
from app.repositories.quest_repository import (
    ItemRewardDraft,
    ObjectiveDraft,
    QuestRepository,
)
from app.repositories.spawn_area_repository import SpawnAreaRepository
from app.repositories.wild_pokemon_repository import WildPokemonRepository
from app.repositories.world_item_spawn_repository import WorldItemSpawnRepository


class AdminService:
    """Operations the admin frontend will call to manage the world."""

    def __init__(
        self,
        *,
        species_repository: PokemonSpeciesRepository,
        move_repository: MoveRepository,
        item_repository: ItemRepository,
        quest_repository: QuestRepository,
        world_item_spawn_repository: WorldItemSpawnRepository,
        item_spawn_area_repository: ItemSpawnAreaRepository,
        map_object_repository: MapObjectRepository,
        npc_repository: NpcRepository,
        spawn_area_repository: SpawnAreaRepository,
        event_area_repository: EventAreaRepository,
        gym_repository: GymRepository,
        wild_pokemon_repository: WildPokemonRepository,
    ) -> None:
        self._species = species_repository
        self._moves = move_repository
        self._items = item_repository
        self._quests = quest_repository
        self._world_item_spawns = world_item_spawn_repository
        self._item_spawn_areas = item_spawn_area_repository
        self._map_objects = map_object_repository
        self._npcs = npc_repository
        self._spawn_areas = spawn_area_repository
        self._event_areas = event_area_repository
        self._gyms = gym_repository
        self._wild = wild_pokemon_repository

    def upsert_species(
        self,
        *,
        species_id: int,
        name: str,
        primary_type: PokemonType,
        secondary_type: PokemonType | None,
        base_stats: BaseStats,
        capture_rate: int,
        base_experience: int,
        is_starter: bool,
        is_rare: bool,
    ) -> PokemonSpecies:
        species = PokemonSpecies(
            id=species_id,
            name=name,
            primary_type=primary_type,
            secondary_type=secondary_type,
            base_stats=base_stats,
            capture_rate=capture_rate,
            base_experience=base_experience,
            is_starter=is_starter,
            is_rare=is_rare,
        )
        return self._species.upsert(species)

    def list_species(self) -> list[PokemonSpecies]:
        return self._species.list_all()

    def upsert_move(
        self,
        *,
        name: str,
        type_: PokemonType,
        category: MoveCategory,
        power: int | None,
        accuracy: int | None,
        pp: int,
    ) -> Move:
        return self._moves.upsert(
            name=name, type_=type_, category=category, power=power, accuracy=accuracy, pp=pp
        )

    def list_moves(self) -> list[Move]:
        return self._moves.list_all()

    def delete_move(self, move_id: int) -> None:
        self._moves.delete(move_id)

    def upsert_item(
        self,
        *,
        item_id: int | None,
        name: str,
        category: ItemCategory,
        description: str,
        buy_price: int | None,
        sell_price: int | None,
        effect: ItemEffect | None,
        stackable: bool,
    ) -> Item:
        if item_id is None:
            return self._items.upsert(
                name=name,
                category=category,
                description=description,
                buy_price=buy_price,
                sell_price=sell_price,
                effect=effect,
                stackable=stackable,
            )
        return self._items.update(
            item_id=item_id,
            name=name,
            category=category,
            description=description,
            buy_price=buy_price,
            sell_price=sell_price,
            effect=effect,
            stackable=stackable,
        )

    def list_items(self) -> list[Item]:
        return self._items.list_all()

    def delete_item(self, item_id: int) -> None:
        self._items.delete(item_id)

    def create_quest(
        self,
        *,
        admin_id: int,
        title: str,
        description: str,
        minimum_level: int,
        reward_pokecoins: int,
        reward_experience: int,
        time_limit_seconds: int | None,
        is_repeatable: bool,
        follow_up_quest_id: int | None,
        objectives: list[ObjectiveDraft],
        item_rewards: list[ItemRewardDraft],
    ) -> Quest:
        return self._quests.create(
            title=title,
            description=description,
            minimum_level=minimum_level,
            reward_pokecoins=reward_pokecoins,
            reward_experience=reward_experience,
            time_limit_seconds=time_limit_seconds,
            is_repeatable=is_repeatable,
            follow_up_quest_id=follow_up_quest_id,
            objectives=objectives,
            item_rewards=item_rewards,
            created_by_admin_id=admin_id,
        )

    def update_quest(
        self,
        *,
        quest_id: int,
        title: str,
        description: str,
        minimum_level: int,
        reward_pokecoins: int,
        reward_experience: int,
        time_limit_seconds: int | None,
        is_repeatable: bool,
        follow_up_quest_id: int | None,
        objectives: list[ObjectiveDraft],
        item_rewards: list[ItemRewardDraft],
    ) -> Quest:
        return self._quests.update(
            quest_id=quest_id,
            title=title,
            description=description,
            minimum_level=minimum_level,
            reward_pokecoins=reward_pokecoins,
            reward_experience=reward_experience,
            time_limit_seconds=time_limit_seconds,
            is_repeatable=is_repeatable,
            follow_up_quest_id=follow_up_quest_id,
            objectives=objectives,
            item_rewards=item_rewards,
        )

    def delete_quest(self, quest_id: int) -> None:
        self._quests.delete(quest_id)

    def list_quests(self) -> list[Quest]:
        return self._quests.list_all()

    def get_quest(self, quest_id: int) -> Quest:
        return self._quests.get_by_id(quest_id)

    def place_world_item(
        self,
        *,
        admin_id: int,
        item_id: int,
        quantity: int,
        location: GeoLocation,
        is_hidden: bool,
        expires_at: datetime | None,
    ) -> WorldItemSpawn:
        self._items.get_by_id(item_id)  # validate item exists
        return self._world_item_spawns.create(
            item_id=item_id,
            quantity=quantity,
            location=location,
            is_hidden=is_hidden,
            expires_at=expires_at,
            created_by_admin_id=admin_id,
        )

    def deactivate_world_item(self, spawn_id: int) -> None:
        self._world_item_spawns.deactivate(spawn_id)

    def list_world_items(self) -> list[WorldItemSpawn]:
        return self._world_item_spawns.list_all_active()

    def create_item_spawn_area(
        self,
        *,
        admin_id: int,
        name: str,
        center: GeoLocation,
        radius_meters: float,
        entries: list[tuple[int, float, int]],
    ) -> ItemSpawnArea:
        area = self._item_spawn_areas.create(
            name=name,
            center=center,
            radius_meters=radius_meters,
            created_by_admin_id=admin_id,
        )
        if entries:
            area = self._item_spawn_areas.set_items(area.id, entries)
        return area

    def set_item_spawn_area_items(
        self,
        area_id: int,
        entries: list[tuple[int, float, int]],
    ) -> ItemSpawnArea:
        return self._item_spawn_areas.set_items(area_id, entries)

    def delete_item_spawn_area(self, area_id: int) -> None:
        self._item_spawn_areas.delete(area_id)

    def list_item_spawn_areas(self) -> list[ItemSpawnArea]:
        return self._item_spawn_areas.list_all()

    def list_species_moves(self, species_id: int) -> list[LearnableMove]:
        return self._moves.list_learnable_all_for_species(species_id)

    def set_species_moves(
        self, species_id: int, entries: list[tuple[int, int]]
    ) -> list[LearnableMove]:
        return self._moves.set_learnable_for_species(species_id, entries)

    def create_map_object(
        self,
        *,
        admin_id: int,
        kind: str,
        name: str | None,
        location: GeoLocation,
        metadata: dict | None,
    ) -> MapObject:
        return self._map_objects.create(
            kind=kind, name=name, location=location, metadata=metadata, created_by_admin_id=admin_id
        )

    def delete_map_object(self, map_object_id: int) -> None:
        self._map_objects.delete(map_object_id)

    def list_map_objects(self) -> list[MapObject]:
        return self._map_objects.list_all()

    def create_npc(
        self,
        *,
        admin_id: int,
        name: str,
        role: NPCRole,
        location: GeoLocation,
        dialogue: str | None,
        metadata: dict | None,
    ) -> NonPlayerCharacter:
        return self._npcs.create(
            name=name,
            role=role,
            location=location,
            dialogue=dialogue,
            metadata=metadata,
            created_by_admin_id=admin_id,
        )

    def delete_npc(self, npc_id: int) -> None:
        self._npcs.delete(npc_id)

    def list_npcs(self) -> list[NonPlayerCharacter]:
        return self._npcs.list_all()

    def create_spawn_area(
        self,
        *,
        admin_id: int,
        name: str,
        center: GeoLocation,
        radius_meters: float,
    ) -> SpawnArea:
        return self._spawn_areas.create(
            name=name,
            center=center,
            radius_meters=radius_meters,
            primary_type=PokemonType.NORMAL,
            secondary_type=None,
            spawn_weight=1.0,
            created_by_admin_id=admin_id,
        )

    def set_spawn_area_pokemon(
        self,
        spawn_area_id: int,
        entries: list[tuple[int, float]],
    ) -> SpawnArea:
        """Replace the pokemon list of a spawn area and return the updated area."""
        self._spawn_areas.set_pokemon(spawn_area_id, entries)
        return self._spawn_areas.get_by_id(spawn_area_id)

    def get_spawn_area(self, spawn_area_id: int) -> SpawnArea:
        return self._spawn_areas.get_by_id(spawn_area_id)

    def delete_spawn_area(self, spawn_area_id: int) -> None:
        self._spawn_areas.delete(spawn_area_id)

    def list_spawn_areas(self) -> list[SpawnArea]:
        return self._spawn_areas.list_all()

    def create_event_area(
        self,
        *,
        admin_id: int,
        name: str,
        description: str | None,
        center: GeoLocation,
        radius_meters: float,
        starts_at: datetime,
        ends_at: datetime,
        metadata: dict | None,
    ) -> EventArea:
        return self._event_areas.create(
            name=name,
            description=description,
            center=center,
            radius_meters=radius_meters,
            starts_at=starts_at,
            ends_at=ends_at,
            metadata=metadata,
            created_by_admin_id=admin_id,
        )

    def delete_event_area(self, event_area_id: int) -> None:
        self._event_areas.delete(event_area_id)

    def list_event_areas(self) -> list[EventArea]:
        return self._event_areas.list_all()

    def create_gym(
        self,
        *,
        admin_id: int,
        name: str,
        location: GeoLocation,
    ) -> Gym:
        return self._gyms.create(name=name, location=location, created_by_admin_id=admin_id)

    def delete_gym(self, gym_id: int) -> None:
        self._gyms.delete(gym_id)

    def list_gyms(self) -> list[Gym]:
        return self._gyms.list_all()

    def create_rare_wild_pokemon(
        self,
        *,
        admin_id: int,
        species_id: int,
        level: int,
        location: GeoLocation,
        expires_at: datetime | None,
    ) -> WildPokemon:
        species = self._species.get_by_id(species_id)
        if not species.is_rare:
            raise NotFoundError(f"species {species.name} is not flagged as rare")
        from app.domain.characters.stats import IndividualValues, StatCalculator
        max_ivs = IndividualValues(31, 31, 31, 31, 31, 31)
        max_hp = StatCalculator.compute(species.base_stats, max_ivs, level).max_hp
        return self._wild.create(
            species_id=species_id,
            level=level,
            location=location,
            current_hp=max_hp,
            expires_at=expires_at,
            created_by_admin_id=admin_id,
        )

    def deactivate_rare_wild_pokemon(self, wild_id: int) -> None:
        self._wild.deactivate(wild_id)

    def list_rare_wild_pokemon(self) -> list[WildPokemon]:
        return self._wild.list_all_active()
