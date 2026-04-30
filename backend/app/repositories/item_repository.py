# app/repositories/item_repository.py

from __future__ import annotations

import sqlite3

from app.core.exceptions import NotFoundError
from app.domain.items.item import Item, ItemCategory
from app.repositories.base_repository import BaseRepository


class ItemRepository(BaseRepository):
    def upsert(
        self,
        *,
        name: str,
        category: ItemCategory,
        description: str,
        buy_price: int | None,
        sell_price: int | None,
        effect_value: int | None,
        stackable: bool,
    ) -> Item:
        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO items (name, category, description, buy_price, sell_price, effect_value, stackable)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET
                    category=excluded.category,
                    description=excluded.description,
                    buy_price=excluded.buy_price,
                    sell_price=excluded.sell_price,
                    effect_value=excluded.effect_value,
                    stackable=excluded.stackable
                """,
                (name, category.value, description, buy_price, sell_price, effect_value, int(stackable)),
            )
            row = conn.execute("SELECT * FROM items WHERE name = ?", (name,)).fetchone()
        return self._hydrate(row)

    def get_by_id(self, item_id: int) -> Item:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        if row is None:
            raise NotFoundError(f"item {item_id} not found")
        return self._hydrate(row)

    def get_by_name(self, name: str) -> Item:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM items WHERE name = ?", (name,)).fetchone()
        if row is None:
            raise NotFoundError(f"item '{name}' not found")
        return self._hydrate(row)

    def list_all(self) -> list[Item]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM items ORDER BY id").fetchall()
        return [self._hydrate(row) for row in rows]

    def _hydrate(self, row: sqlite3.Row) -> Item:
        return Item(
            id=row["id"],
            name=row["name"],
            category=ItemCategory(row["category"]),
            description=row["description"],
            buy_price=row["buy_price"],
            sell_price=row["sell_price"],
            effect_value=row["effect_value"],
            stackable=bool(row["stackable"]),
        )
