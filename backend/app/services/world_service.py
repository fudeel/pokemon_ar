# app/services/world_service.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from app.domain.characters.non_player_character import NonPlayerCharacter
from app.domain.characters.wild_pokemon import WildPokemon
from app.domain.world.event_area import EventArea
from app.domain.world.geo_location import GeoLocation
from app.domain.world.gym import Gym
from app.domain.world.item_spawn_area import ItemSpawnArea
from app.domain.world.map_object import MapObject
from app.domain.world.spawn_area import SpawnArea
from app.domain.world.world_item_spawn import WorldItemSpawn
from app.repositories.event_area_repository import EventAreaRepository
from app.repositories.gym_repository import GymRepository
from app.repositories.item_spawn_area_repository import ItemSpawnAreaRepository
from app.repositories.map_object_repository import MapObjectRepository
from app.repositories.npc_repository import NpcRepository
from app.repositories.player_repository import PlayerRepository
from app.repositories.spawn_area_repository import SpawnAreaRepository
from app.repositories.wild_pokemon_repository import WildPokemonRepository
from app.repositories.world_item_spawn_repository import WorldItemSpawnRepository
from app.services.bounding_box import BoundingBox


@dataclass(frozen=True, slots=True)
class WorldSnapshot:
    generated_at: datetime
    center: GeoLocation
    radius_meters: float
    map_objects: list[MapObject]
    npcs: list[NonPlayerCharacter]
    spawn_areas: list[SpawnArea]
    event_areas: list[EventArea]
    gyms: list[Gym]
    rare_wild_pokemon: list[WildPokemon]
    world_item_spawns: list[WorldItemSpawn]
    item_spawn_areas: list[ItemSpawnArea]


class WorldService:
    """
    Builds the world snapshot the client downloads on login or location change.

    Common pokemon spawning is NOT included here — those are generated client-side
    using the spawn_areas hint plus the player's local position.
    """

    def __init__(
        self,
        *,
        player_repository: PlayerRepository,
        map_object_repository: MapObjectRepository,
        npc_repository: NpcRepository,
        spawn_area_repository: SpawnAreaRepository,
        event_area_repository: EventAreaRepository,
        gym_repository: GymRepository,
        wild_pokemon_repository: WildPokemonRepository,
        world_item_spawn_repository: WorldItemSpawnRepository,
        item_spawn_area_repository: ItemSpawnAreaRepository,
        snapshot_radius_meters: float,
    ) -> None:
        self._players = player_repository
        self._map_objects = map_object_repository
        self._npcs = npc_repository
        self._spawn_areas = spawn_area_repository
        self._event_areas = event_area_repository
        self._gyms = gym_repository
        self._wild = wild_pokemon_repository
        self._world_item_spawns = world_item_spawn_repository
        self._item_spawn_areas = item_spawn_area_repository
        self._snapshot_radius = snapshot_radius_meters

    def build_snapshot(self, *, player_id: int, center: GeoLocation, radius_meters: float | None = None) -> WorldSnapshot:
        radius = radius_meters if radius_meters is not None else self._snapshot_radius
        self._players.update_location(player_id, center)

        bbox = BoundingBox.around(center, radius)
        now = datetime.now(timezone.utc)

        map_objects = self._map_objects.list_in_bounding_box(bbox.min_lat, bbox.max_lat, bbox.min_lng, bbox.max_lng)
        npcs = self._npcs.list_in_bounding_box(bbox.min_lat, bbox.max_lat, bbox.min_lng, bbox.max_lng)
        spawn_areas = self._spawn_areas.list_in_bounding_box(bbox.min_lat, bbox.max_lat, bbox.min_lng, bbox.max_lng)
        event_areas = self._event_areas.list_active_in_bounding_box(
            instant=now, min_lat=bbox.min_lat, max_lat=bbox.max_lat, min_lng=bbox.min_lng, max_lng=bbox.max_lng
        )
        gyms = self._gyms.list_in_bounding_box(bbox.min_lat, bbox.max_lat, bbox.min_lng, bbox.max_lng)
        rare = self._wild.list_active_in_bounding_box(
            instant=now, min_lat=bbox.min_lat, max_lat=bbox.max_lat, min_lng=bbox.min_lng, max_lng=bbox.max_lng
        )
        world_items = self._world_item_spawns.list_active_in_bounding_box(
            instant=now, min_lat=bbox.min_lat, max_lat=bbox.max_lat, min_lng=bbox.min_lng, max_lng=bbox.max_lng
        )
        item_spawn_areas = self._item_spawn_areas.list_in_bounding_box(
            min_lat=bbox.min_lat, max_lat=bbox.max_lat, min_lng=bbox.min_lng, max_lng=bbox.max_lng
        )

        map_objects = [m for m in map_objects if center.is_within_meters(m.location, radius)]
        npcs = [n for n in npcs if n.location and center.is_within_meters(n.location, radius)]
        spawn_areas = [s for s in spawn_areas if center.is_within_meters(s.center, radius + s.radius_meters)]
        event_areas = [e for e in event_areas if center.is_within_meters(e.center, radius + e.radius_meters)]
        gyms = [g for g in gyms if center.is_within_meters(g.location, radius)]
        rare = [r for r in rare if r.location and center.is_within_meters(r.location, radius)]
        world_items = [w for w in world_items if center.is_within_meters(w.location, radius)]
        item_spawn_areas = [a for a in item_spawn_areas if center.is_within_meters(a.center, radius + a.radius_meters)]

        return WorldSnapshot(
            generated_at=now,
            center=center,
            radius_meters=radius,
            map_objects=map_objects,
            npcs=npcs,
            spawn_areas=spawn_areas,
            event_areas=event_areas,
            gyms=gyms,
            rare_wild_pokemon=rare,
            world_item_spawns=world_items,
            item_spawn_areas=item_spawn_areas,
        )
