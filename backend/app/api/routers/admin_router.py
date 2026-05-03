# app/api/routers/admin_router.py

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import container_dep, current_admin_id
from app.api.presenters import (
    event_area_to_model,
    gym_to_model,
    item_to_model,
    map_object_to_model,
    npc_to_model,
    quest_to_model,
    spawn_area_to_model,
    species_to_model,
    wild_pokemon_to_model,
)
from app.api.schemas.admin import (
    EventAreaCreateRequest,
    GymCreateRequest,
    ItemModel,
    ItemUpsertRequest,
    LearnableMoveModel,
    MapObjectCreateRequest,
    MoveUpsertRequest,
    NpcCreateRequest,
    QuestModel,
    QuestUpsertRequest,
    RareWildPokemonCreateRequest,
    SpawnAreaCreateRequest,
    SpawnAreaSetPokemonRequest,
    SpeciesMoveEntry,
    SpeciesMovesSetRequest,
    SpeciesUpsertRequest,
)
from app.api.schemas.auth import (
    AdminLoginRequest,
    AdminRegistrationRequest,
    TokenResponse,
)
from app.api.schemas.pokemon import MoveModel, PokemonSpeciesModel
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
from app.domain.items.item import ItemCategory
from app.domain.pokemon.move import MoveCategory
from app.domain.pokemon.pokemon_type import PokemonType
from app.domain.quests.objective_type import QuestObjectiveType
from app.domain.world.geo_location import GeoLocation
from app.repositories.quest_repository import ItemRewardDraft, ObjectiveDraft


public_router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(current_admin_id)])


def _resolve_pokemon_type(value: str) -> PokemonType:
    try:
        return PokemonType(value)
    except ValueError as exc:
        raise ValidationError(f"unknown pokemon type '{value}'") from exc


def _resolve_move_category(value: str) -> MoveCategory:
    try:
        return MoveCategory(value)
    except ValueError as exc:
        raise ValidationError(f"unknown move category '{value}'") from exc


def _resolve_npc_role(value: str) -> NPCRole:
    try:
        return NPCRole(value)
    except ValueError as exc:
        raise ValidationError(f"unknown npc role '{value}'") from exc


def _resolve_item_category(value: str) -> ItemCategory:
    try:
        return ItemCategory(value)
    except ValueError as exc:
        raise ValidationError(f"unknown item category '{value}'") from exc


def _resolve_objective_type(value: str) -> QuestObjectiveType:
    try:
        return QuestObjectiveType(value)
    except ValueError as exc:
        raise ValidationError(f"unknown quest objective type '{value}'") from exc


def _to_geo(model) -> GeoLocation:
    return GeoLocation(latitude=model.latitude, longitude=model.longitude)


def _build_objective_drafts(payload: QuestUpsertRequest) -> list[ObjectiveDraft]:
    drafts: list[ObjectiveDraft] = []
    for objective in payload.objectives:
        location = None
        if objective.target_lat is not None and objective.target_lng is not None:
            location = GeoLocation(
                latitude=objective.target_lat, longitude=objective.target_lng
            )
        drafts.append(
            ObjectiveDraft(
                objective_type=_resolve_objective_type(objective.objective_type),
                description=objective.description,
                target_quantity=objective.target_quantity,
                target_item_id=objective.target_item_id,
                target_species_id=objective.target_species_id,
                target_pokemon_type=(
                    _resolve_pokemon_type(objective.target_pokemon_type)
                    if objective.target_pokemon_type
                    else None
                ),
                target_npc_id=objective.target_npc_id,
                target_location=location,
                target_radius_meters=objective.target_radius_meters,
                target_level=objective.target_level,
            )
        )
    return drafts


def _build_item_reward_drafts(payload: QuestUpsertRequest) -> list[ItemRewardDraft]:
    return [
        ItemRewardDraft(item_id=reward.item_id, quantity=reward.quantity)
        for reward in payload.item_rewards
    ]


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


@router.put("/moves", response_model=MoveModel)
def upsert_move(
    payload: MoveUpsertRequest,
    container: Container = Depends(container_dep),
) -> MoveModel:
    move = container.admin_service.upsert_move(
        name=payload.name,
        type_=_resolve_pokemon_type(payload.type),
        category=_resolve_move_category(payload.category),
        power=payload.power,
        accuracy=payload.accuracy,
        pp=payload.pp,
    )
    return MoveModel(
        id=move.id,
        name=move.name,
        type=move.type.value,
        category=move.category.value,
        power=move.power,
        accuracy=move.accuracy,
        pp=move.pp,
    )


@router.get("/moves", response_model=list[MoveModel])
def list_moves(container: Container = Depends(container_dep)) -> list[MoveModel]:
    return [
        MoveModel(
            id=m.id, name=m.name, type=m.type.value, category=m.category.value,
            power=m.power, accuracy=m.accuracy, pp=m.pp,
        )
        for m in container.admin_service.list_moves()
    ]


@router.get("/species/{species_id}/moves", response_model=list[LearnableMoveModel])
def list_species_moves(
    species_id: int, container: Container = Depends(container_dep)
) -> list[LearnableMoveModel]:
    return [
        LearnableMoveModel(
            move=MoveModel(
                id=lm.move.id, name=lm.move.name, type=lm.move.type.value,
                category=lm.move.category.value, power=lm.move.power,
                accuracy=lm.move.accuracy, pp=lm.move.pp,
            ),
            learn_level=lm.learn_level,
        )
        for lm in container.admin_service.list_species_moves(species_id)
    ]


@router.put("/species/{species_id}/moves", response_model=list[LearnableMoveModel])
def set_species_moves(
    species_id: int,
    payload: SpeciesMovesSetRequest,
    container: Container = Depends(container_dep),
) -> list[LearnableMoveModel]:
    entries = [(e.move_id, e.learn_level) for e in payload.moves]
    return [
        LearnableMoveModel(
            move=MoveModel(
                id=lm.move.id, name=lm.move.name, type=lm.move.type.value,
                category=lm.move.category.value, power=lm.move.power,
                accuracy=lm.move.accuracy, pp=lm.move.pp,
            ),
            learn_level=lm.learn_level,
        )
        for lm in container.admin_service.set_species_moves(species_id, entries)
    ]


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


@router.delete("/moves/{move_id}", status_code=204)
def delete_move(move_id: int, container: Container = Depends(container_dep)) -> None:
    container.admin_service.delete_move(move_id)


@router.put("/items", response_model=ItemModel)
def upsert_item(
    payload: ItemUpsertRequest,
    container: Container = Depends(container_dep),
) -> ItemModel:
    item = container.admin_service.upsert_item(
        item_id=None,
        name=payload.name,
        category=_resolve_item_category(payload.category),
        description=payload.description,
        buy_price=payload.buy_price,
        sell_price=payload.sell_price,
        effect_value=payload.effect_value,
        stackable=payload.stackable,
    )
    return item_to_model(item)


@router.put("/items/{item_id}", response_model=ItemModel)
def update_item(
    item_id: int,
    payload: ItemUpsertRequest,
    container: Container = Depends(container_dep),
) -> ItemModel:
    item = container.admin_service.upsert_item(
        item_id=item_id,
        name=payload.name,
        category=_resolve_item_category(payload.category),
        description=payload.description,
        buy_price=payload.buy_price,
        sell_price=payload.sell_price,
        effect_value=payload.effect_value,
        stackable=payload.stackable,
    )
    return item_to_model(item)


@router.get("/items", response_model=list[ItemModel])
def list_items(container: Container = Depends(container_dep)) -> list[ItemModel]:
    return [item_to_model(i) for i in container.admin_service.list_items()]


@router.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, container: Container = Depends(container_dep)) -> None:
    container.admin_service.delete_item(item_id)


@router.post("/quests", response_model=QuestModel, status_code=201)
def create_quest(
    payload: QuestUpsertRequest,
    admin_id: int = Depends(current_admin_id),
    container: Container = Depends(container_dep),
) -> QuestModel:
    quest = container.admin_service.create_quest(
        admin_id=admin_id,
        title=payload.title,
        description=payload.description,
        minimum_level=payload.minimum_level,
        reward_pokecoins=payload.reward_pokecoins,
        reward_experience=payload.reward_experience,
        time_limit_seconds=payload.time_limit_seconds,
        is_repeatable=payload.is_repeatable,
        follow_up_quest_id=payload.follow_up_quest_id,
        objectives=_build_objective_drafts(payload),
        item_rewards=_build_item_reward_drafts(payload),
    )
    return quest_to_model(quest)


@router.put("/quests/{quest_id}", response_model=QuestModel)
def update_quest(
    quest_id: int,
    payload: QuestUpsertRequest,
    container: Container = Depends(container_dep),
) -> QuestModel:
    quest = container.admin_service.update_quest(
        quest_id=quest_id,
        title=payload.title,
        description=payload.description,
        minimum_level=payload.minimum_level,
        reward_pokecoins=payload.reward_pokecoins,
        reward_experience=payload.reward_experience,
        time_limit_seconds=payload.time_limit_seconds,
        is_repeatable=payload.is_repeatable,
        follow_up_quest_id=payload.follow_up_quest_id,
        objectives=_build_objective_drafts(payload),
        item_rewards=_build_item_reward_drafts(payload),
    )
    return quest_to_model(quest)


@router.delete("/quests/{quest_id}", status_code=204)
def delete_quest(quest_id: int, container: Container = Depends(container_dep)) -> None:
    container.admin_service.delete_quest(quest_id)


@router.get("/quests", response_model=list[QuestModel])
def list_quests(container: Container = Depends(container_dep)) -> list[QuestModel]:
    return [quest_to_model(q) for q in container.admin_service.list_quests()]


@router.get("/quests/{quest_id}", response_model=QuestModel)
def get_quest(quest_id: int, container: Container = Depends(container_dep)) -> QuestModel:
    return quest_to_model(container.admin_service.get_quest(quest_id))
