# app/api/schemas/admin_users.py

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.api.schemas.common import GeoLocationModel
from app.api.schemas.player import InventorySlotModel, PlayerModel
from app.api.schemas.pokemon import PokemonInstanceModel
from app.api.schemas.wallet import WalletTransactionModel


class AdminPlayerSummaryModel(BaseModel):
    """Lightweight row used in the admin user list."""

    id: int
    username: str
    email: str
    level: int
    pokecoins: int
    has_chosen_starter: bool
    last_seen_at: datetime | None
    created_at: datetime


class AdminPlayerListResponse(BaseModel):
    items: list[AdminPlayerSummaryModel]
    total: int = Field(ge=0)
    limit: int = Field(ge=1, le=200)
    offset: int = Field(ge=0)


class AdminPlayerDetailResponse(BaseModel):
    player: PlayerModel
    pokemon: list[PokemonInstanceModel]
    inventory: list[InventorySlotModel]
    recent_transactions: list[WalletTransactionModel]


class AdminPlayerUpdateRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    email: str = Field(min_length=3, max_length=255)
    level: int = Field(ge=1, le=100)
    experience: int = Field(ge=0)
    has_chosen_starter: bool
    location: GeoLocationModel | None = None


class AdminPokecoinsAdjustRequest(BaseModel):
    """Either set the balance to an absolute value or apply a signed delta.

    Exactly one of `delta` or `set_to` must be provided. The change is recorded
    in the wallet ledger as an `admin_grant` transaction.
    """

    delta: int | None = None
    set_to: int | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=255)


class AdminPasswordResetRequest(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)
