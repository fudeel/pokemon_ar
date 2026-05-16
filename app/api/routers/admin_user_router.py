# app/api/routers/admin_user_router.py

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import container_dep, current_admin_id
from app.api.presenters import (
    admin_player_detail_to_response,
    admin_player_list_to_response,
    wallet_transaction_to_model,
)
from app.api.schemas.admin_users import (
    AdminPasswordResetRequest,
    AdminPlayerDetailResponse,
    AdminPlayerListResponse,
    AdminPlayerUpdateRequest,
    AdminPokecoinsAdjustRequest,
)
from app.api.schemas.wallet import WalletTransactionPage
from app.container import Container
from app.domain.world.geo_location import GeoLocation


router = APIRouter(
    prefix="/admin/users",
    tags=["admin-users"],
    dependencies=[Depends(current_admin_id)],
)


@router.get("", response_model=AdminPlayerListResponse)
def list_users(
    container: Container = Depends(container_dep),
    limit: int = Query(default=25, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    search: str | None = Query(default=None, max_length=128),
) -> AdminPlayerListResponse:
    page = container.admin_user_service.list_users(
        limit=limit, offset=offset, search=search
    )
    return admin_player_list_to_response(page)


@router.get("/{player_id}", response_model=AdminPlayerDetailResponse)
def get_user(
    player_id: int,
    container: Container = Depends(container_dep),
) -> AdminPlayerDetailResponse:
    detail = container.admin_user_service.get_user(player_id)
    return admin_player_detail_to_response(detail)


@router.put("/{player_id}", response_model=AdminPlayerDetailResponse)
def update_user(
    player_id: int,
    payload: AdminPlayerUpdateRequest,
    container: Container = Depends(container_dep),
) -> AdminPlayerDetailResponse:
    location = (
        GeoLocation(
            latitude=payload.location.latitude,
            longitude=payload.location.longitude,
        )
        if payload.location is not None
        else None
    )
    container.admin_user_service.update_user(
        player_id,
        username=payload.username,
        email=payload.email,
        level=payload.level,
        experience=payload.experience,
        has_chosen_starter=payload.has_chosen_starter,
        location=location,
    )
    detail = container.admin_user_service.get_user(player_id)
    return admin_player_detail_to_response(detail)


@router.put("/{player_id}/pokecoins", response_model=AdminPlayerDetailResponse)
def adjust_user_pokecoins(
    player_id: int,
    payload: AdminPokecoinsAdjustRequest,
    container: Container = Depends(container_dep),
) -> AdminPlayerDetailResponse:
    container.admin_user_service.adjust_pokecoins(
        player_id,
        delta=payload.delta,
        set_to=payload.set_to,
        notes=payload.notes,
    )
    detail = container.admin_user_service.get_user(player_id)
    return admin_player_detail_to_response(detail)


@router.put("/{player_id}/password", status_code=204)
def reset_user_password(
    player_id: int,
    payload: AdminPasswordResetRequest,
    container: Container = Depends(container_dep),
) -> None:
    container.admin_user_service.reset_password(player_id, payload.new_password)


@router.delete("/{player_id}", status_code=204)
def delete_user(
    player_id: int,
    container: Container = Depends(container_dep),
) -> None:
    container.admin_user_service.delete_user(player_id)


@router.get("/{player_id}/transactions", response_model=WalletTransactionPage)
def list_user_transactions(
    player_id: int,
    container: Container = Depends(container_dep),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> WalletTransactionPage:
    transactions = container.admin_user_service.list_transactions(
        player_id, limit=limit, offset=offset
    )
    items = [wallet_transaction_to_model(t) for t in transactions]
    return WalletTransactionPage(
        items=items, limit=limit, offset=offset, returned=len(items)
    )
