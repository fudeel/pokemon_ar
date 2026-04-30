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
from app.repositories.event_area_repository import EventAreaRepository
from app.repositories.gym_repository import GymRepository
from app.repositories.map_object_repository import MapObjectRepository
from app.repositories.npc_repository import NpcRepository
from app.repositories.pokemon_species_repository import PokemonSpeciesRepository
from app.repositories.spawn_area_repository import SpawnAreaRepository
from app.repositories.wild_pokemon_repository import WildPokemonRepository


class AdminService:
    """Operations the admin frontend will call to manage the world."""

    def __init__(
        self,
        *,
        species_repository: PokemonSpeciesRepository,
        map_object_repository: MapObjectRepository,
        npc_repository: NpcRepository,
        spawn_area_repository: SpawnAreaRepository,
        event_area_repository: EventAreaRepository,
        gym_repository: GymRepository,
        wild_pokemon_repository: WildPokemonRepository,
    ) -> None:
        self._species = species_repository
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
        primary_type: PokemonType,
        secondary_type: PokemonType | None,
        spawn_weight: float,
    ) -> SpawnArea:
        return self._spawn_areas.create(
            name=name,
            center=center,
            radius_meters=radius_meters,
            primary_type=primary_type,
            secondary_type=secondary_type,
            spawn_weight=spawn_weight,
            created_by_admin_id=admin_id,
        )

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
