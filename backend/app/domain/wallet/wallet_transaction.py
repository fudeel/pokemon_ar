# app/domain/wallet/wallet_transaction.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from app.domain.wallet.transaction_type import WalletTransactionType


@dataclass(frozen=True, slots=True)
class WalletTransaction:
    """An immutable ledger entry recording a single change to a player's pokecoin balance.

    `amount` is signed: positive for credits, negative for debits.
    `balance_after` is the player's pokecoin balance immediately after this entry was applied.
    `reference_id` is an opaque foreign key to the originating record (quest id, npc id,
    stripe charge row, etc.) — its meaning depends on `transaction_type`.
    """

    id: int | None
    player_id: int
    amount: int
    transaction_type: WalletTransactionType
    reference_id: int | None
    notes: str | None
    balance_after: int
    created_at: datetime
