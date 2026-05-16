# app/services/wallet_service.py

from __future__ import annotations

import sqlite3
from dataclasses import dataclass

from app.core.exceptions import InsufficientResourcesError, ValidationError
from app.domain.wallet.transaction_type import WalletTransactionType
from app.domain.wallet.wallet_transaction import WalletTransaction
from app.repositories.player_repository import PlayerRepository
from app.repositories.wallet_transaction_repository import WalletTransactionRepository


@dataclass(frozen=True, slots=True)
class WalletAdjustment:
    """Result of applying a single wallet movement."""

    transaction: WalletTransaction
    balance_after: int


class WalletService:
    """The single source of truth for every change to a player's pokecoin balance.

    All credits (quest rewards, gym victories, PvP wins, Stripe purchases, admin grants,
    refunds) and all debits (merchant purchases, future fees) MUST go through
    `credit()` or `debit()`. Each call writes a ledger row in the same atomic
    transaction as the balance update, so the ledger and balance can never diverge.

    The frontend never writes to a player's balance directly: it triggers events
    (battle outcomes, quest completions, payments) and the corresponding backend
    service calls into this wallet service.
    """

    def __init__(
        self,
        *,
        player_repository: PlayerRepository,
        wallet_transaction_repository: WalletTransactionRepository,
    ) -> None:
        self._players = player_repository
        self._transactions = wallet_transaction_repository

    def credit(
        self,
        *,
        player_id: int,
        amount: int,
        transaction_type: WalletTransactionType,
        reference_id: int | None = None,
        notes: str | None = None,
    ) -> WalletAdjustment:
        if amount <= 0:
            raise ValidationError("credit amount must be positive")
        return self._apply(
            player_id=player_id,
            delta=amount,
            transaction_type=transaction_type,
            reference_id=reference_id,
            notes=notes,
        )

    def debit(
        self,
        *,
        player_id: int,
        amount: int,
        transaction_type: WalletTransactionType,
        reference_id: int | None = None,
        notes: str | None = None,
    ) -> WalletAdjustment:
        if amount <= 0:
            raise ValidationError("debit amount must be positive")
        return self._apply(
            player_id=player_id,
            delta=-amount,
            transaction_type=transaction_type,
            reference_id=reference_id,
            notes=notes,
        )

    def credit_in_tx(
        self,
        conn: sqlite3.Connection,
        *,
        player_id: int,
        amount: int,
        transaction_type: WalletTransactionType,
        reference_id: int | None = None,
        notes: str | None = None,
    ) -> WalletAdjustment:
        """Credit pokecoins inside a caller-managed transaction.

        Use this when the wallet movement must be atomic with other repository
        writes (e.g. inserting a battle result row, marking a quest claimed).
        """
        if amount <= 0:
            raise ValidationError("credit amount must be positive")
        return self._apply_in_tx(
            conn,
            player_id=player_id,
            delta=amount,
            transaction_type=transaction_type,
            reference_id=reference_id,
            notes=notes,
        )

    def debit_in_tx(
        self,
        conn: sqlite3.Connection,
        *,
        player_id: int,
        amount: int,
        transaction_type: WalletTransactionType,
        reference_id: int | None = None,
        notes: str | None = None,
    ) -> WalletAdjustment:
        if amount <= 0:
            raise ValidationError("debit amount must be positive")
        return self._apply_in_tx(
            conn,
            player_id=player_id,
            delta=-amount,
            transaction_type=transaction_type,
            reference_id=reference_id,
            notes=notes,
        )

    def get_balance(self, player_id: int) -> int:
        return self._players.get_by_id(player_id).pokecoins

    def list_transactions(
        self, player_id: int, *, limit: int = 50, offset: int = 0
    ) -> list[WalletTransaction]:
        if limit < 1 or limit > 200:
            raise ValidationError("limit must be between 1 and 200")
        if offset < 0:
            raise ValidationError("offset must be non-negative")
        return self._transactions.list_for_player(player_id, limit=limit, offset=offset)

    def _apply(
        self,
        *,
        player_id: int,
        delta: int,
        transaction_type: WalletTransactionType,
        reference_id: int | None,
        notes: str | None,
    ) -> WalletAdjustment:
        with self._players.db.transaction() as conn:
            return self._apply_in_tx(
                conn,
                player_id=player_id,
                delta=delta,
                transaction_type=transaction_type,
                reference_id=reference_id,
                notes=notes,
            )

    def _apply_in_tx(
        self,
        conn: sqlite3.Connection,
        *,
        player_id: int,
        delta: int,
        transaction_type: WalletTransactionType,
        reference_id: int | None,
        notes: str | None,
    ) -> WalletAdjustment:
        try:
            balance_after = self._players.adjust_pokecoins_in_tx(conn, player_id, delta)
        except ValueError as exc:
            raise InsufficientResourcesError(
                f"player {player_id} does not have enough pokecoins for this transaction"
            ) from exc
        transaction = self._transactions.append(
            conn=conn,
            player_id=player_id,
            amount=delta,
            transaction_type=transaction_type,
            reference_id=reference_id,
            notes=notes,
            balance_after=balance_after,
        )
        return WalletAdjustment(transaction=transaction, balance_after=balance_after)
