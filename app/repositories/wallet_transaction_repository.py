# app/repositories/wallet_transaction_repository.py

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError
from app.domain.wallet.transaction_type import WalletTransactionType
from app.domain.wallet.wallet_transaction import WalletTransaction
from app.repositories.base_repository import BaseRepository


class WalletTransactionRepository(BaseRepository):
    """Persists immutable pokecoin ledger entries.

    Every change to a player's pokecoin balance must be appended here as a new row;
    rows are never updated or deleted (history is the truth). The companion
    `WalletService` is the only place that should write to this repository.
    """

    def append(
        self,
        *,
        conn: sqlite3.Connection,
        player_id: int,
        amount: int,
        transaction_type: WalletTransactionType,
        reference_id: int | None,
        notes: str | None,
        balance_after: int,
    ) -> WalletTransaction:
        cursor = conn.execute(
            """
            INSERT INTO wallet_transactions (
                player_id, amount, transaction_type,
                reference_id, notes, balance_after
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                player_id,
                amount,
                transaction_type.value,
                reference_id,
                notes,
                balance_after,
            ),
        )
        return self.get_by_id(cursor.lastrowid, conn=conn)

    def get_by_id(
        self,
        transaction_id: int,
        *,
        conn: sqlite3.Connection | None = None,
    ) -> WalletTransaction:
        if conn is not None:
            row = conn.execute(
                "SELECT * FROM wallet_transactions WHERE id = ?",
                (transaction_id,),
            ).fetchone()
        else:
            with self.db.connection() as conn2:
                row = conn2.execute(
                    "SELECT * FROM wallet_transactions WHERE id = ?",
                    (transaction_id,),
                ).fetchone()
        if row is None:
            raise NotFoundError(f"wallet transaction {transaction_id} not found")
        return self._hydrate(row)

    def list_for_player(
        self,
        player_id: int,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> list[WalletTransaction]:
        with self.db.connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM wallet_transactions
                WHERE player_id = ?
                ORDER BY created_at DESC, id DESC
                LIMIT ? OFFSET ?
                """,
                (player_id, limit, offset),
            ).fetchall()
        return [self._hydrate(row) for row in rows]

    def _hydrate(self, row: sqlite3.Row) -> WalletTransaction:
        created_at = self.parse_timestamp(row["created_at"]) or datetime.now(timezone.utc)
        return WalletTransaction(
            id=row["id"],
            player_id=row["player_id"],
            amount=row["amount"],
            transaction_type=WalletTransactionType(row["transaction_type"]),
            reference_id=row["reference_id"],
            notes=row["notes"],
            balance_after=row["balance_after"],
            created_at=created_at,
        )
