# app/repositories/merchant_repository.py

from __future__ import annotations

import sqlite3

from app.core.exceptions import AlreadyExistsError, NotFoundError
from app.domain.items.merchant import Merchant, MerchantItem
from app.repositories.base_repository import BaseRepository


class MerchantRepository(BaseRepository):
    def create(
        self,
        *,
        name: str,
        description: str | None,
        created_by_admin_id: int | None,
    ) -> Merchant:
        try:
            with self.db.connection() as conn:
                cursor = conn.execute(
                    """
                    INSERT INTO merchants (name, description, created_by_admin_id)
                    VALUES (?, ?, ?)
                    """,
                    (name, description, created_by_admin_id),
                )
                merchant_id = cursor.lastrowid
        except sqlite3.IntegrityError as exc:
            raise AlreadyExistsError(f"merchant name '{name}' already taken") from exc
        return self.get_by_id(merchant_id)

    def update(self, merchant_id: int, *, name: str, description: str | None) -> Merchant:
        try:
            with self.db.connection() as conn:
                cursor = conn.execute(
                    "UPDATE merchants SET name = ?, description = ? WHERE id = ?",
                    (name, description, merchant_id),
                )
        except sqlite3.IntegrityError as exc:
            raise AlreadyExistsError(f"merchant name '{name}' already taken") from exc
        if cursor.rowcount == 0:
            raise NotFoundError(f"merchant {merchant_id} not found")
        return self.get_by_id(merchant_id)

    def delete(self, merchant_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute("DELETE FROM merchants WHERE id = ?", (merchant_id,))
        if cursor.rowcount == 0:
            raise NotFoundError(f"merchant {merchant_id} not found")

    def get_by_id(self, merchant_id: int) -> Merchant:
        with self.db.connection() as conn:
            row = conn.execute(
                "SELECT * FROM merchants WHERE id = ?", (merchant_id,)
            ).fetchone()
            if row is None:
                raise NotFoundError(f"merchant {merchant_id} not found")
            items = self._load_items(conn, merchant_id)
        return self._hydrate(row, items)

    def list_all(self) -> list[Merchant]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM merchants ORDER BY id").fetchall()
            return [self._hydrate(row, self._load_items(conn, row["id"])) for row in rows]

    def set_items(
        self,
        merchant_id: int,
        entries: list[tuple[int, int | None]],  # (item_id, price_override)
    ) -> Merchant:
        with self.db.transaction() as conn:
            existing = conn.execute(
                "SELECT 1 FROM merchants WHERE id = ?", (merchant_id,)
            ).fetchone()
            if existing is None:
                raise NotFoundError(f"merchant {merchant_id} not found")
            conn.execute(
                "DELETE FROM merchant_items WHERE merchant_id = ?", (merchant_id,)
            )
            conn.executemany(
                """
                INSERT INTO merchant_items (merchant_id, item_id, price_override)
                VALUES (?, ?, ?)
                """,
                [(merchant_id, item_id, price) for item_id, price in entries],
            )
        return self.get_by_id(merchant_id)

    def _load_items(
        self, conn: sqlite3.Connection, merchant_id: int
    ) -> list[MerchantItem]:
        rows = conn.execute(
            """
            SELECT mi.item_id, mi.price_override,
                   i.name AS item_name, i.category AS item_category, i.buy_price
            FROM merchant_items mi
            JOIN items i ON i.id = mi.item_id
            WHERE mi.merchant_id = ?
            ORDER BY i.name
            """,
            (merchant_id,),
        ).fetchall()
        return [
            MerchantItem(
                item_id=row["item_id"],
                item_name=row["item_name"],
                item_category=row["item_category"],
                base_buy_price=row["buy_price"],
                price_override=row["price_override"],
            )
            for row in rows
        ]

    def _hydrate(self, row: sqlite3.Row, items: list[MerchantItem]) -> Merchant:
        return Merchant(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            items=items,
            created_at=self.parse_timestamp(row["created_at"]),
            created_by_admin_id=row["created_by_admin_id"],
        )
