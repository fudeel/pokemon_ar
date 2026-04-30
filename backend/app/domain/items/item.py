# app/domain/items/item.py

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class ItemCategory(StrEnum):
    POKEBALL = "pokeball"
    POTION = "potion"
    REVIVE = "revive"
    KEY = "key"
    MISC = "misc"


@dataclass(frozen=True, slots=True)
class Item:
    id: int
    name: str
    category: ItemCategory
    description: str
    buy_price: int | None
    sell_price: int | None
    effect_value: int | None
    stackable: bool
