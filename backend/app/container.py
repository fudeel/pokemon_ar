# app/container.py

from __future__ import annotations

from app.config import CONFIG, AppConfig
from app.core.database import Database
from app.core.security import PasswordHasher, TokenGenerator
from app.repositories.admin_repository import AdminRepository
from app.repositories.auth_token_repository import AuthTokenRepository
from app.repositories.event_area_repository import EventAreaRepository
from app.repositories.gym_repository import GymRepository
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.item_repository import ItemRepository
from app.repositories.map_object_repository import MapObjectRepository
from app.repositories.move_repository import MoveRepository
from app.repositories.npc_repository import NpcRepository
from app.repositories.player_repository import PlayerRepository
from app.repositories.pokemon_instance_repository import PokemonInstanceRepository
from app.repositories.pokemon_species_repository import PokemonSpeciesRepository
from app.repositories.quest_repository import QuestRepository
from app.repositories.spawn_area_repository import SpawnAreaRepository
from app.repositories.wild_pokemon_repository import WildPokemonRepository
from app.services.admin_service import AdminService
from app.services.auth_service import AuthService
from app.services.capture_service import CaptureService
from app.services.player_profile_service import PlayerProfileService
from app.services.starter_service import StarterService
from app.services.world_service import WorldService


class Container:
    """Single composition root. All wiring lives here, nowhere else."""

    def __init__(self, config: AppConfig = CONFIG) -> None:
        self.config = config
        self.database = Database(config.database_path, config.schema_path)

        self.password_hasher = PasswordHasher()
        self.token_generator = TokenGenerator()

        self.player_repository = PlayerRepository(self.database)
        self.admin_repository = AdminRepository(self.database)
        self.token_repository = AuthTokenRepository(self.database)
        self.species_repository = PokemonSpeciesRepository(self.database)
        self.move_repository = MoveRepository(self.database)
        self.instance_repository = PokemonInstanceRepository(
            self.database, self.species_repository, self.move_repository
        )
        self.item_repository = ItemRepository(self.database)
        self.inventory_repository = InventoryRepository(self.database, self.item_repository)
        self.map_object_repository = MapObjectRepository(self.database)
        self.npc_repository = NpcRepository(self.database)
        self.spawn_area_repository = SpawnAreaRepository(self.database)
        self.event_area_repository = EventAreaRepository(self.database)
        self.gym_repository = GymRepository(self.database)
        self.wild_pokemon_repository = WildPokemonRepository(self.database, self.species_repository)
        self.quest_repository = QuestRepository(self.database)

        self.auth_service = AuthService(
            player_repository=self.player_repository,
            admin_repository=self.admin_repository,
            token_repository=self.token_repository,
            password_hasher=self.password_hasher,
            token_generator=self.token_generator,
            player_token_lifetime_seconds=config.token_lifetime_seconds,
            admin_token_lifetime_seconds=config.admin_token_lifetime_seconds,
        )
        self.starter_service = StarterService(
            player_repository=self.player_repository,
            species_repository=self.species_repository,
            instance_repository=self.instance_repository,
            move_repository=self.move_repository,
        )
        self.world_service = WorldService(
            player_repository=self.player_repository,
            map_object_repository=self.map_object_repository,
            npc_repository=self.npc_repository,
            spawn_area_repository=self.spawn_area_repository,
            event_area_repository=self.event_area_repository,
            gym_repository=self.gym_repository,
            wild_pokemon_repository=self.wild_pokemon_repository,
            snapshot_radius_meters=config.world_snapshot_radius_meters,
        )
        self.capture_service = CaptureService(
            player_repository=self.player_repository,
            wild_repository=self.wild_pokemon_repository,
            species_repository=self.species_repository,
            instance_repository=self.instance_repository,
            inventory_repository=self.inventory_repository,
            item_repository=self.item_repository,
            move_repository=self.move_repository,
            capture_proximity_meters=config.capture_proximity_meters,
        )
        self.profile_service = PlayerProfileService(
            player_repository=self.player_repository,
            instance_repository=self.instance_repository,
            inventory_repository=self.inventory_repository,
        )
        self.admin_service = AdminService(
            species_repository=self.species_repository,
            move_repository=self.move_repository,
            item_repository=self.item_repository,
            quest_repository=self.quest_repository,
            map_object_repository=self.map_object_repository,
            npc_repository=self.npc_repository,
            spawn_area_repository=self.spawn_area_repository,
            event_area_repository=self.event_area_repository,
            gym_repository=self.gym_repository,
            wild_pokemon_repository=self.wild_pokemon_repository,
        )

    def initialize(self) -> None:
        self.database.initialize_schema()


_container: Container | None = None


def get_container() -> Container:
    global _container
    if _container is None:
        _container = Container()
        _container.initialize()
    return _container
