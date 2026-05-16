# app/repositories/inventory_repository.py

from __future__ import annotations

from app.core.exceptions import InsufficientResourcesError
from app.domain.items.inventory import Inventory, InventorySlot
from app.repositories.base_repository import BaseRepository
from app.repositories.item_repository import ItemRepository


class InventoryRepository(BaseRepository):
    def __init__(self, database, item_repository: ItemRepository) -> None:
        super().__init__(database)
        self._item_repository = item_repository

    def get_for_player(self, player_id: int) -> Inventory:
        with self.db.connection() as conn:
            rows = conn.execute(
                "SELECT item_id, quantity FROM player_inventory WHERE player_id = ? AND quantity > 0 ORDER BY item_id",
                (player_id,),
            ).fetchall()
        slots = [
            InventorySlot(item=self._item_repository.get_by_id(row["item_id"]), quantity=row["quantity"])
            for row in rows
        ]
        return Inventory(player_id=player_id, slots=slots)

    def add(self, player_id: int, item_id: int, quantity: int) -> int:
        if quantity <= 0:
            raise ValueError("quantity must be positive")
        with self.db.transaction() as conn:
            conn.execute(
                """
                INSERT INTO player_inventory (player_id, item_id, quantity)
                VALUES (?, ?, ?)
                ON CONFLICT(player_id, item_id) DO UPDATE SET quantity = quantity + excluded.quantity
                """,
                (player_id, item_id, quantity),
            )
            row = conn.execute(
                "SELECT quantity FROM player_inventory WHERE player_id = ? AND item_id = ?",
                (player_id, item_id),
            ).fetchone()
        return row["quantity"]

    def consume(self, player_id: int, item_id: int, quantity: int) -> int:
        if quantity <= 0:
            raise ValueError("quantity must be positive")
        with self.db.transaction() as conn:
            row = conn.execute(
                "SELECT quantity FROM player_inventory WHERE player_id = ? AND item_id = ?",
                (player_id, item_id),
            ).fetchone()
            current = row["quantity"] if row else 0
            if current < quantity:
                raise InsufficientResourcesError(
                    f"player {player_id} has {current} of item {item_id}, requires {quantity}"
                )
            new_quantity = current - quantity
            conn.execute(
                "UPDATE player_inventory SET quantity = ? WHERE player_id = ? AND item_id = ?",
                (new_quantity, player_id, item_id),
            )
        return new_quantity
