# app/repositories/item_repository.py

from __future__ import annotations

import json
import sqlite3

from app.core.exceptions import NotFoundError
from app.domain.items.item import Item, ItemCategory, ItemEffect
from app.repositories.base_repository import BaseRepository


def _serialize_effect(effect: ItemEffect | None) -> str | None:
    if effect is None:
        return None
    return json.dumps(
        {
            "target": effect.target,
            "attribute": effect.attribute,
            "operation": effect.operation,
            "value": effect.value,
        }
    )


def _deserialize_effect(raw: str | None) -> ItemEffect | None:
    if raw is None or raw == "":
        return None
    data = json.loads(raw)
    return ItemEffect(
        target=data["target"],
        attribute=data["attribute"],
        operation=data["operation"],
        value=data["value"],
    )


class ItemRepository(BaseRepository):
    def upsert(
        self,
        *,
        name: str,
        category: ItemCategory,
        description: str,
        buy_price: int | None,
        sell_price: int | None,
        effect: ItemEffect | None,
        stackable: bool,
    ) -> Item:
        effect_json = _serialize_effect(effect)
        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO items (name, category, description, buy_price, sell_price, effect, stackable)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET
                    category=excluded.category,
                    description=excluded.description,
                    buy_price=excluded.buy_price,
                    sell_price=excluded.sell_price,
                    effect=excluded.effect,
                    stackable=excluded.stackable
                """,
                (name, category.value, description, buy_price, sell_price, effect_json, int(stackable)),
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

    def update(
        self,
        *,
        item_id: int,
        name: str,
        category: ItemCategory,
        description: str,
        buy_price: int | None,
        sell_price: int | None,
        effect: ItemEffect | None,
        stackable: bool,
    ) -> Item:
        effect_json = _serialize_effect(effect)
        with self.db.connection() as conn:
            cursor = conn.execute(
                """
                UPDATE items
                SET name = ?, category = ?, description = ?,
                    buy_price = ?, sell_price = ?,
                    effect = ?, stackable = ?
                WHERE id = ?
                """,
                (
                    name,
                    category.value,
                    description,
                    buy_price,
                    sell_price,
                    effect_json,
                    int(stackable),
                    item_id,
                ),
            )
            if cursor.rowcount == 0:
                raise NotFoundError(f"item {item_id} not found")
            row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        return self._hydrate(row)

    def delete(self, item_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute("DELETE FROM items WHERE id = ?", (item_id,))
        if cursor.rowcount == 0:
            raise NotFoundError(f"item {item_id} not found")

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
            effect=_deserialize_effect(row["effect"]),
            stackable=bool(row["stackable"]),
        )
