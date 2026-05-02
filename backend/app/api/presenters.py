# app/api/presenters.py

from __future__ import annotations

from app.api.schemas.common import GeoLocationModel
from app.api.schemas.player import InventorySlotModel, PlayerModel, PlayerProfileResponse
from app.api.schemas.pokemon import (
    BaseStatsModel,
    EffectiveStatsModel,
    EquippedMoveModel,
    IndividualValuesModel,
    MoveModel,
    PokemonInstanceModel,
    PokemonSpeciesModel,
)
from app.api.schemas.world import (
    EventAreaModel,
    GymDefenderModel,
    GymModel,
    MapObjectModel,
    NpcModel,
    SpawnAreaModel,
    SpawnAreaPokemonModel,
    WildPokemonModel,
    WorldSnapshotResponse,
)
from app.domain.characters.non_player_character import NonPlayerCharacter
from app.domain.characters.player import Player
from app.domain.characters.wild_pokemon import WildPokemon
from app.domain.items.inventory import Inventory
from app.domain.pokemon.move import EquippedMove, Move
from app.domain.pokemon.pokemon_instance import PokemonInstance
from app.domain.pokemon.pokemon_species import PokemonSpecies
from app.domain.world.event_area import EventArea
from app.domain.world.geo_location import GeoLocation
from app.domain.world.gym import Gym
from app.domain.world.map_object import MapObject
from app.domain.world.spawn_area import SpawnArea
from app.services.player_profile_service import PlayerProfile
from app.services.world_service import WorldSnapshot


def geo_to_model(location: GeoLocation | None) -> GeoLocationModel | None:
    if location is None:
        return None
    return GeoLocationModel(latitude=location.latitude, longitude=location.longitude)


def player_to_model(player: Player) -> PlayerModel:
    return PlayerModel(
        id=player.id,
        username=player.username,
        email=player.email,
        level=player.level,
        experience=player.experience,
        pokecoins=player.pokecoins,
        has_chosen_starter=player.has_chosen_starter,
        location=geo_to_model(player.location),
        last_seen_at=player.last_seen_at,
        created_at=player.created_at,
    )


def species_to_model(species: PokemonSpecies) -> PokemonSpeciesModel:
    return PokemonSpeciesModel(
        id=species.id,
        name=species.name,
        primary_type=species.primary_type.value,
        secondary_type=species.secondary_type.value if species.secondary_type else None,
        base_stats=BaseStatsModel(
            hp=species.base_stats.hp,
            attack=species.base_stats.attack,
            defense=species.base_stats.defense,
            special_attack=species.base_stats.special_attack,
            special_defense=species.base_stats.special_defense,
            speed=species.base_stats.speed,
        ),
        capture_rate=species.capture_rate,
        base_experience=species.base_experience,
        is_starter=species.is_starter,
        is_rare=species.is_rare,
    )


def move_to_model(move: Move) -> MoveModel:
    return MoveModel(
        id=move.id,
        name=move.name,
        type=move.type.value,
        category=move.category.value,
        power=move.power,
        accuracy=move.accuracy,
        pp=move.pp,
    )


def equipped_move_to_model(equipped: EquippedMove) -> EquippedMoveModel:
    return EquippedMoveModel(slot=equipped.slot, move=move_to_model(equipped.move), current_pp=equipped.current_pp)


def pokemon_instance_to_model(instance: PokemonInstance) -> PokemonInstanceModel:
    eff = instance.effective_stats
    return PokemonInstanceModel(
        id=instance.id,
        species=species_to_model(instance.species),
        owner_player_id=instance.owner_player_id,
        nickname=instance.nickname,
        level=instance.level,
        experience=instance.experience,
        current_hp=instance.current_hp,
        effective_stats=EffectiveStatsModel(
            max_hp=eff.max_hp,
            attack=eff.attack,
            defense=eff.defense,
            special_attack=eff.special_attack,
            special_defense=eff.special_defense,
            speed=eff.speed,
        ),
        ivs=IndividualValuesModel(
            hp=instance.ivs.hp,
            attack=instance.ivs.attack,
            defense=instance.ivs.defense,
            special_attack=instance.ivs.special_attack,
            special_defense=instance.ivs.special_defense,
            speed=instance.ivs.speed,
        ),
        moves=[equipped_move_to_model(m) for m in instance.moves],
        caught_at=instance.caught_at,
        caught_location=geo_to_model(instance.caught_location),
    )


def inventory_to_models(inventory: Inventory) -> list[InventorySlotModel]:
    return [
        InventorySlotModel(
            item_id=slot.item.id,
            item_name=slot.item.name,
            category=slot.item.category.value,
            quantity=slot.quantity,
        )
        for slot in inventory.slots
    ]


def profile_to_response(profile: PlayerProfile) -> PlayerProfileResponse:
    return PlayerProfileResponse(
        player=player_to_model(profile.player),
        pokemon=[pokemon_instance_to_model(p) for p in profile.pokemon],
        inventory=inventory_to_models(profile.inventory),
    )


def map_object_to_model(map_object: MapObject) -> MapObjectModel:
    return MapObjectModel(
        id=map_object.id,
        kind=map_object.kind,
        name=map_object.name,
        location=geo_to_model(map_object.location),
        metadata=map_object.metadata,
    )


def npc_to_model(npc: NonPlayerCharacter) -> NpcModel:
    return NpcModel(
        id=npc.id,
        name=npc.display_name,
        role=npc.role.value,
        location=geo_to_model(npc.location),
        dialogue=npc.dialogue,
        metadata=npc.metadata,
    )


def spawn_area_to_model(area: SpawnArea) -> SpawnAreaModel:
    return SpawnAreaModel(
        id=area.id,
        name=area.name,
        center=geo_to_model(area.center),
        radius_meters=area.radius_meters,
        pokemon=[
            SpawnAreaPokemonModel(
                species_id=p.species_id,
                species_name=p.species_name,
                spawn_chance=p.spawn_chance,
            )
            for p in area.pokemon
        ],
    )


def event_area_to_model(area: EventArea) -> EventAreaModel:
    return EventAreaModel(
        id=area.id,
        name=area.name,
        description=area.description,
        center=geo_to_model(area.center),
        radius_meters=area.radius_meters,
        starts_at=area.starts_at,
        ends_at=area.ends_at,
        metadata=area.metadata,
    )


def gym_to_model(gym: Gym) -> GymModel:
    return GymModel(
        id=gym.id,
        name=gym.name,
        location=geo_to_model(gym.location),
        current_leader_player_id=gym.current_leader_player_id,
        leader_since=gym.leader_since,
        defenders=[
            GymDefenderModel(slot=d.slot, pokemon_instance_id=d.pokemon_instance_id, effective_level=d.effective_level)
            for d in gym.defenders
        ],
    )


def wild_pokemon_to_model(wild: WildPokemon) -> WildPokemonModel:
    return WildPokemonModel(
        id=wild.id,
        species_id=wild.species_id,
        species_name=wild.species_name,
        level=wild.level,
        current_hp=wild.current_hp,
        location=geo_to_model(wild.location),
        expires_at=wild.expires_at,
    )


def snapshot_to_response(snapshot: WorldSnapshot) -> WorldSnapshotResponse:
    return WorldSnapshotResponse(
        generated_at=snapshot.generated_at,
        center=geo_to_model(snapshot.center),
        radius_meters=snapshot.radius_meters,
        map_objects=[map_object_to_model(m) for m in snapshot.map_objects],
        npcs=[npc_to_model(n) for n in snapshot.npcs],
        spawn_areas=[spawn_area_to_model(s) for s in snapshot.spawn_areas],
        event_areas=[event_area_to_model(e) for e in snapshot.event_areas],
        gyms=[gym_to_model(g) for g in snapshot.gyms],
        rare_wild_pokemon=[wild_pokemon_to_model(w) for w in snapshot.rare_wild_pokemon],
    )
