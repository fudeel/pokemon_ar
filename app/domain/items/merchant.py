# app/domain/items/merchant.py

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass(frozen=True, slots=True)
class MerchantItem:
    """A single sellable slot in a merchant's catalogue.

    `price_override` lets an admin sell an item at a different price from
    `items.buy_price`. When None, the player pays the catalogue price.
    """

    item_id: int
    item_name: str
    item_category: str
    base_buy_price: int | None
    price_override: int | None

    @property
    def effective_price(self) -> int:
        if self.price_override is not None:
            return self.price_override
        if self.base_buy_price is None:
            raise ValueError(
                f"item {self.item_id} has no buy price and no override; cannot be sold"
            )
        return self.base_buy_price


@dataclass(frozen=True, slots=True)
class Merchant:
    """A reusable catalogue of items that can be attached to a merchant NPC."""

    id: int | None
    name: str
    description: str | None
    items: list[MerchantItem] = field(default_factory=list)
    created_at: datetime | None = None
    created_by_admin_id: int | None = None
