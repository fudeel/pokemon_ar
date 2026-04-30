# app/domain/items/inventory.py

from __future__ import annotations

from dataclasses import dataclass

from app.domain.items.item import Item


@dataclass(slots=True)
class InventorySlot:
    item: Item
    quantity: int

    def __post_init__(self) -> None:
        if self.quantity < 0:
            raise ValueError("quantity cannot be negative")


@dataclass(slots=True)
class Inventory:
    """An in-memory view of a player's inventory. Persistence is repository-level."""

    player_id: int
    slots: list[InventorySlot]

    def find(self, item_id: int) -> InventorySlot | None:
        for slot in self.slots:
            if slot.item.id == item_id:
                return slot
        return None

    def has(self, item_id: int, minimum_quantity: int = 1) -> bool:
        slot = self.find(item_id)
        return slot is not None and slot.quantity >= minimum_quantity
