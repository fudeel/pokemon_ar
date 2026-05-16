# app/api/schemas/wallet.py

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class WalletTransactionModel(BaseModel):
    id: int
    amount: int
    transaction_type: str
    reference_id: int | None
    notes: str | None
    balance_after: int
    created_at: datetime


class WalletBalanceResponse(BaseModel):
    player_id: int
    pokecoins: int


class WalletTransactionPage(BaseModel):
    items: list[WalletTransactionModel]
    limit: int = Field(ge=1, le=200)
    offset: int = Field(ge=0)
    returned: int = Field(ge=0)
