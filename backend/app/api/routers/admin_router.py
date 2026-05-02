# app/api/routers/admin_router.py

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import container_dep, current_admin_id
from app.api.presenters import (
    event_area_to_model,
    gym_to_model,
    map_object_to_model,
    npc_to_model,
    spawn_area_to_model,
    species_to_model,
    wild_pokemon_to_model,
)
from app.api.schemas.admin import (
    EventAreaCreateRequest,
    GymCreateRequest,
    MapObjectCreateRequest,
    NpcCreateRequest,
    RareWildPokemonCreateRequest,
    SpawnAreaCreateRequest,
    SpawnAreaSetPokemonRequest,
    SpeciesUpsertRequest,
)
from app.api.schemas.auth import (
    AdminLoginRequest,
    AdminRegistrationRequest,
    TokenResponse,
)
from app.api.schemas.pokemon import PokemonSpeciesModel
from app.api.schemas.world import (
    EventAreaModel,
    GymModel,
    MapObjectModel,
    NpcModel,
    SpawnAreaModel,
    WildPokemonModel,
)
from app.container import Container
from app.core.exceptions import ValidationError
from app.domain.characters.non_player_character import NPCRole
from app.domain.characters.stats import BaseStats
from app.domain.pokemon.pokemon_type import PokemonType
from app.domain.world.geo_location import GeoLocation


public_router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(current_admin_id)])


def _resolve_pokemon_type(value: str) -> PokemonType:
    try:
        return PokemonType(value)
    except ValueError as exc:
        raise ValidationError(f"unknown pokemon type '{value}'") from exc


def _resolve_npc_role(value: str) -> NPCRole:
    try:
        return NPCRole(value)
    except ValueError as exc:
        raise ValidationError(f"unknown npc role '{value}'") from exc


def _to_geo(model) -> GeoLocation:
    return GeoLocation(latitude=model.latitude, longitude=model.longitude)


@public_router.post("/login", response_model=TokenResponse)
def admin_login(
    payload: AdminLoginRequest,
    container: Container = Depends(container_dep),
) -> TokenResponse:
    issued = container.auth_service.login_admin(username=payload.username, password=payload.password)
    return TokenResponse(token=issued.token, expires_at=issued.expires_at)


@public_router.post("/bootstrap", response_model=TokenResponse, status_code=201)
def admin_bootstrap(
    payload: AdminRegistrationRequest,
    container: Container = Depends(container_dep),
) -> TokenResponse:
    """Create the very first admin. Once any admin exists this endpoint is locked."""
    if container.auth_service.admin_count() > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="bootstrap already used; create new admins via an authenticated endpoint",
        )
    container.auth_service.register_admin(username=payload.username, password=payload.password)
    issued = container.auth_service.login_admin(username=payload.username, password=payload.password)
    return TokenResponse(token=issued.token, expires_at=issued.expires_at)


@router.post("/admins", status_code=201)
def create_admin(
    payload: AdminRegistrationRequest,
    container: Container = Depends(container_dep),
) -> dict:
    admin_id = container.auth_service.register_admin(username=payload.username, password=payload.password)
    return {"id": admin_id}


@router.put("/species", response_model=PokemonSpeciesModel)
def upsert_species(
    payload: SpeciesUpsertRequest,
    container: Container = Depends(container_dep),
) -> PokemonSpeciesModel:
    species = container.admin_service.upsert_species(
        species_id=payload.id,
        name=payload.name,
        primary_type=_resolve_pokemon_type(payload.primary_type),
        secondary_type=_resolve_pokemon_type(payload.secondary_type) if payload.secondary_type else None,
        base_stats=BaseStats(
            hp=payload.base_stats.hp,
            attack=payload.base_stats.attack,
            defense=payload.base_stats.defense,
            special_attack=payload.base_stats.special_attack,
            special_defense=payload.base_stats.special_defense,
            speed=payload.base_stats.speed,
        ),
        capture_rate=payload.capture_rate,
        base_experience=payload.base_experience,
        is_starter=payload.is_starter,
        is_rare=payload.is_rare,
    )
    return species_to_model(species)


@router.get("/species", response_model=list[PokemonSpeciesModel])
def list_species(container: Container = Depends(container_dep)) -> list[PokemonSpeciesModel]:
    return [species_to_model(s) for s in container.admin_service.list_species()]


@router.post("/map-objects", response_model=MapObjectModel, status_code=201)
def create_map_object(
    payload: MapObjectCreateRequest,
    admin_id: int = Depends(current_admin_id),
    container: Container = Depends(container_dep),
) -> MapObjectModel:
    obj = container.admin_service.create_map_object(
        admin_id=admin_id,
        kind=payload.kind,
        name=payload.name,
        location=_to_geo(payload.location),
        metadata=payload.metadata,
    )
    return map_object_to_model(obj)


@router.delete("/map-objects/{map_object_id}", status_code=204)
def delete_map_object(map_object_id: int, container: Container = Depends(container_dep)) -> None:
    container.admin_service.delete_map_object(map_object_id)


@router.get("/map-objects", response_model=list[MapObjectModel])
def list_map_objects(container: Container = Depends(container_dep)) -> list[MapObjectModel]:
    return [map_object_to_model(o) for o in container.admin_service.list_map_objects()]


@router.post("/npcs", response_model=NpcModel, status_code=201)
def create_npc(
    payload: NpcCreateRequest,
    admin_id: int = Depends(current_admin_id),
    container: Container = Depends(container_dep),
) -> NpcModel:
    npc = container.admin_service.create_npc(
        admin_id=admin_id,
        name=payload.name,
        role=_resolve_npc_role(payload.role),
        location=_to_geo(payload.location),
        dialogue=payload.dialogue,
        metadata=payload.metadata,
    )
    return npc_to_model(npc)


@router.delete("/npcs/{npc_id}", status_code=204)
def delete_npc(npc_id: int, container: Container = Depends(container_dep)) -> None:
    container.admin_service.delete_npc(npc_id)


@router.get("/npcs", response_model=list[NpcModel])
def list_npcs(container: Container = Depends(container_dep)) -> list[NpcModel]:
    return [npc_to_model(n) for n in container.admin_service.list_npcs()]


@router.post("/spawn-areas", response_model=SpawnAreaModel, status_code=201)
def create_spawn_area(
    payload: SpawnAreaCreateRequest,
    admin_id: int = Depends(current_admin_id),
    container: Container = Depends(container_dep),
) -> SpawnAreaModel:
    area = container.admin_service.create_spawn_area(
        admin_id=admin_id,
        name=payload.name,
        center=_to_geo(payload.center),
        radius_meters=payload.radius_meters,
    )
    if payload.pokemon:
        area = container.admin_service.set_spawn_area_pokemon(
            area.id,
            [(entry.species_id, entry.spawn_chance) for entry in payload.pokemon],
        )
    return spawn_area_to_model(area)


@router.put("/spawn-areas/{spawn_area_id}/pokemon", response_model=SpawnAreaModel)
def set_spawn_area_pokemon(
    spawn_area_id: int,
    payload: SpawnAreaSetPokemonRequest,
    container: Container = Depends(container_dep),
) -> SpawnAreaModel:
    area = container.admin_service.set_spawn_area_pokemon(
        spawn_area_id,
        [(entry.species_id, entry.spawn_chance) for entry in payload.pokemon],
    )
    return spawn_area_to_model(area)


@router.delete("/spawn-areas/{spawn_area_id}", status_code=204)
def delete_spawn_area(spawn_area_id: int, container: Container = Depends(container_dep)) -> None:
    container.admin_service.delete_spawn_area(spawn_area_id)


@router.get("/spawn-areas", response_model=list[SpawnAreaModel])
def list_spawn_areas(container: Container = Depends(container_dep)) -> list[SpawnAreaModel]:
    return [spawn_area_to_model(a) for a in container.admin_service.list_spawn_areas()]


@router.post("/event-areas", response_model=EventAreaModel, status_code=201)
def create_event_area(
    payload: EventAreaCreateRequest,
    admin_id: int = Depends(current_admin_id),
    container: Container = Depends(container_dep),
) -> EventAreaModel:
    area = container.admin_service.create_event_area(
        admin_id=admin_id,
        name=payload.name,
        description=payload.description,
        center=_to_geo(payload.center),
        radius_meters=payload.radius_meters,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        metadata=payload.metadata,
    )
    return event_area_to_model(area)


@router.delete("/event-areas/{event_area_id}", status_code=204)
def delete_event_area(event_area_id: int, container: Container = Depends(container_dep)) -> None:
    container.admin_service.delete_event_area(event_area_id)


@router.get("/event-areas", response_model=list[EventAreaModel])
def list_event_areas(container: Container = Depends(container_dep)) -> list[EventAreaModel]:
    return [event_area_to_model(a) for a in container.admin_service.list_event_areas()]


@router.post("/gyms", response_model=GymModel, status_code=201)
def create_gym(
    payload: GymCreateRequest,
    admin_id: int = Depends(current_admin_id),
    container: Container = Depends(container_dep),
) -> GymModel:
    gym = container.admin_service.create_gym(
        admin_id=admin_id, name=payload.name, location=_to_geo(payload.location)
    )
    return gym_to_model(gym)


@router.delete("/gyms/{gym_id}", status_code=204)
def delete_gym(gym_id: int, container: Container = Depends(container_dep)) -> None:
    container.admin_service.delete_gym(gym_id)


@router.get("/gyms", response_model=list[GymModel])
def list_gyms(container: Container = Depends(container_dep)) -> list[GymModel]:
    return [gym_to_model(g) for g in container.admin_service.list_gyms()]


@router.post("/rare-wild-pokemon", response_model=WildPokemonModel, status_code=201)
def create_rare_wild_pokemon(
    payload: RareWildPokemonCreateRequest,
    admin_id: int = Depends(current_admin_id),
    container: Container = Depends(container_dep),
) -> WildPokemonModel:
    wild = container.admin_service.create_rare_wild_pokemon(
        admin_id=admin_id,
        species_id=payload.species_id,
        level=payload.level,
        location=_to_geo(payload.location),
        expires_at=payload.expires_at,
    )
    return wild_pokemon_to_model(wild)


@router.delete("/rare-wild-pokemon/{wild_id}", status_code=204)
def deactivate_rare_wild_pokemon(wild_id: int, container: Container = Depends(container_dep)) -> None:
    container.admin_service.deactivate_rare_wild_pokemon(wild_id)


@router.get("/rare-wild-pokemon", response_model=list[WildPokemonModel])
def list_rare_wild_pokemon(container: Container = Depends(container_dep)) -> list[WildPokemonModel]:
    return [wild_pokemon_to_model(w) for w in container.admin_service.list_rare_wild_pokemon()]
