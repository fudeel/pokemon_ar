# app/services/merchant_service.py

from __future__ import annotations

from dataclasses import dataclass

from app.core.exceptions import (
    InsufficientResourcesError,
    NotFoundError,
    ValidationError,
)
from app.domain.characters.non_player_character import NPCRole
from app.domain.items.merchant import Merchant
from app.domain.world.geo_location import GeoLocation
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.merchant_repository import MerchantRepository
from app.repositories.npc_repository import NpcRepository
from app.repositories.player_repository import PlayerRepository

_PURCHASE_PROXIMITY_METERS = 60.0


@dataclass(frozen=True, slots=True)
class PurchaseLineItem:
    item_id: int
    quantity: int


@dataclass(frozen=True, slots=True)
class PurchaseLineResult:
    item_id: int
    item_name: str
    quantity: int
    unit_price: int
    line_total: int


@dataclass(frozen=True, slots=True)
class PurchaseReceipt:
    npc_id: int
    merchant_id: int
    lines: list[PurchaseLineResult]
    total_cost: int
    pokecoins_after: int


class MerchantService:
    """Resolves a merchant from an NPC and processes player purchases."""

    def __init__(
        self,
        *,
        merchant_repository: MerchantRepository,
        npc_repository: NpcRepository,
        player_repository: PlayerRepository,
        inventory_repository: InventoryRepository,
        purchase_proximity_meters: float = _PURCHASE_PROXIMITY_METERS,
    ) -> None:
        self._merchants = merchant_repository
        self._npcs = npc_repository
        self._players = player_repository
        self._inventory = inventory_repository
        self._proximity = purchase_proximity_meters

    def get_npc_merchant(self, npc_id: int) -> Merchant:
        npc = self._npcs.get_by_id(npc_id)
        if npc.role is not NPCRole.MERCHANT:
            raise ValidationError(f"npc {npc_id} is not a merchant")
        if npc.merchant_id is None:
            raise NotFoundError(f"npc {npc_id} has no merchant catalogue assigned")
        return self._merchants.get_by_id(npc.merchant_id)

    def purchase(
        self,
        *,
        player_id: int,
        npc_id: int,
        player_location: GeoLocation,
        lines: list[PurchaseLineItem],
    ) -> PurchaseReceipt:
        if not lines:
            raise ValidationError("purchase must include at least one item")
        if any(line.quantity < 1 for line in lines):
            raise ValidationError("each line quantity must be >= 1")

        merged: dict[int, int] = {}
        for line in lines:
            merged[line.item_id] = merged.get(line.item_id, 0) + line.quantity

        npc = self._npcs.get_by_id(npc_id)
        if npc.role is not NPCRole.MERCHANT:
            raise ValidationError(f"npc {npc_id} is not a merchant")
        if npc.merchant_id is None:
            raise NotFoundError(f"npc {npc_id} has no merchant catalogue assigned")

        distance = player_location.distance_meters_to(npc.location)
        if distance > self._proximity:
            raise ValidationError(
                f"too far from merchant ({distance:.0f}m, max {self._proximity:.0f}m)"
            )

        merchant = self._merchants.get_by_id(npc.merchant_id)
        catalogue = {entry.item_id: entry for entry in merchant.items}

        results: list[PurchaseLineResult] = []
        total = 0
        for item_id, quantity in merged.items():
            entry = catalogue.get(item_id)
            if entry is None:
                raise ValidationError(
                    f"item {item_id} is not sold by merchant {merchant.id}"
                )
            unit_price = entry.effective_price
            line_total = unit_price * quantity
            total += line_total
            results.append(
                PurchaseLineResult(
                    item_id=item_id,
                    item_name=entry.item_name,
                    quantity=quantity,
                    unit_price=unit_price,
                    line_total=line_total,
                )
            )

        player = self._players.get_by_id(player_id)
        if player.pokecoins < total:
            raise InsufficientResourcesError(
                f"need {total} pokecoins, have {player.pokecoins}"
            )

        pokecoins_after = self._players.adjust_pokecoins(player_id, -total)
        for result in results:
            self._inventory.add(player_id, result.item_id, result.quantity)

        return PurchaseReceipt(
            npc_id=npc_id,
            merchant_id=merchant.id,
            lines=results,
            total_cost=total,
            pokecoins_after=pokecoins_after,
        )
