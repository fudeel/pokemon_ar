# app/services/world_item_collection_service.py

from __future__ import annotations

from app.core.exceptions import AlreadyExistsError, NotFoundError, OutOfRangeError, ValidationError
from app.domain.world.geo_location import GeoLocation
from app.domain.world.world_item_spawn import WorldItemSpawn
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.player_repository import PlayerRepository
from app.repositories.world_item_spawn_repository import WorldItemSpawnRepository

_COLLECTION_PROXIMITY_METERS = 50.0


class WorldItemCollectionService:
    """Handles a player picking up an admin-placed world item."""

    def __init__(
        self,
        *,
        player_repository: PlayerRepository,
        world_item_spawn_repository: WorldItemSpawnRepository,
        inventory_repository: InventoryRepository,
        collection_proximity_meters: float = _COLLECTION_PROXIMITY_METERS,
    ) -> None:
        self._players = player_repository
        self._spawns = world_item_spawn_repository
        self._inventory = inventory_repository
        self._proximity = collection_proximity_meters

    def collect(
        self,
        *,
        player_id: int,
        spawn_id: int,
        player_location: GeoLocation,
    ) -> WorldItemSpawn:
        spawn = self._spawns.get_by_id(spawn_id)

        if not spawn.is_active:
            raise ValidationError(f"world item spawn {spawn_id} is no longer active")

        distance = player_location.distance_meters_to(spawn.location)
        if distance > self._proximity:
            raise OutOfRangeError(
                f"too far from item ({distance:.0f}m, max {self._proximity}m)"
            )

        if self._spawns.has_been_collected_by(spawn_id, player_id):
            raise AlreadyExistsError("you have already collected this item")

        self._spawns.record_collection(spawn_id=spawn_id, player_id=player_id)
        self._inventory.add(player_id, spawn.item_id, spawn.quantity)

        return spawn
