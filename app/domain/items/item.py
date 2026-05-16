# app/domain/items/item.py

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Any


class ItemCategory(StrEnum):
    POKEBALL = "pokeball"
    POTION = "potion"
    REVIVE = "revive"
    KEY = "key"
    MISC = "misc"


@dataclass(frozen=True, slots=True)
class ItemEffect:
    """Declarative effect applied when the item is used.

    target: what the effect is applied to (e.g. 'pokemon', 'player').
    attribute: dotted path to the field on the target (e.g. 'hp', 'nerfs.venom_poison').
    operation: 'set' replaces the value; 'delta' adds the numeric value to the existing one.
    value: the literal value to set, or the delta amount.
    """

    target: str
    attribute: str
    operation: str
    value: Any


@dataclass(frozen=True, slots=True)
class Item:
    id: int
    name: str
    category: ItemCategory
    description: str
    buy_price: int | None
    sell_price: int | None
    effect: ItemEffect | None
    stackable: bool
