# app/services/admin_user_service.py

from __future__ import annotations

from dataclasses import dataclass

from app.core.exceptions import NotFoundError, ValidationError
from app.domain.characters.experience import ExperienceTable
from app.domain.characters.player import Player
from app.domain.items.inventory import Inventory
from app.domain.pokemon.pokemon_instance import PokemonInstance
from app.domain.wallet.transaction_type import WalletTransactionType
from app.domain.wallet.wallet_transaction import WalletTransaction
from app.domain.world.geo_location import GeoLocation
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.player_repository import PlayerRepository
from app.repositories.pokemon_instance_repository import PokemonInstanceRepository
from app.repositories.wallet_transaction_repository import WalletTransactionRepository
from app.services.auth_service import AuthService
from app.services.wallet_service import WalletService


@dataclass(frozen=True, slots=True)
class AdminPlayerListPage:
    """Paginated slice of players with the total count."""

    items: list[Player]
    total: int
    limit: int
    offset: int


@dataclass(frozen=True, slots=True)
class AdminPlayerDetail:
    """Full picture of a single player for the admin detail screen."""

    player: Player
    pokemon: list[PokemonInstance]
    inventory: Inventory
    recent_transactions: list[WalletTransaction]


class AdminUserService:
    """Operations the admin frontend uses to inspect and edit players.

    Mutations to a player's pokecoin balance always go through the WalletService
    so the ledger and the balance stay consistent.
    """

    _RECENT_TRANSACTIONS_LIMIT: int = 25

    def __init__(
        self,
        *,
        player_repository: PlayerRepository,
        instance_repository: PokemonInstanceRepository,
        inventory_repository: InventoryRepository,
        wallet_transaction_repository: WalletTransactionRepository,
        wallet_service: WalletService,
        auth_service: AuthService,
    ) -> None:
        self._players = player_repository
        self._instances = instance_repository
        self._inventory = inventory_repository
        self._transactions = wallet_transaction_repository
        self._wallet = wallet_service
        self._auth = auth_service

    def list_users(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
    ) -> AdminPlayerListPage:
        if limit < 1 or limit > 200:
            raise ValidationError("limit must be between 1 and 200")
        if offset < 0:
            raise ValidationError("offset must be non-negative")
        normalized_search = search.strip() if search else None
        if normalized_search == "":
            normalized_search = None
        items = self._players.list_paginated(
            limit=limit, offset=offset, search=normalized_search
        )
        total = self._players.count(search=normalized_search)
        return AdminPlayerListPage(items=items, total=total, limit=limit, offset=offset)

    def get_user(self, player_id: int) -> AdminPlayerDetail:
        player = self._players.get_by_id(player_id)
        return AdminPlayerDetail(
            player=player,
            pokemon=self._instances.list_for_player(player_id),
            inventory=self._inventory.get_for_player(player_id),
            recent_transactions=self._transactions.list_for_player(
                player_id, limit=self._RECENT_TRANSACTIONS_LIMIT, offset=0
            ),
        )

    def update_user(
        self,
        player_id: int,
        *,
        username: str,
        email: str,
        level: int,
        experience: int,
        has_chosen_starter: bool,
        location: GeoLocation | None,
    ) -> Player:
        username = username.strip()
        email = email.strip()
        if not username:
            raise ValidationError("username cannot be empty")
        if not email or "@" not in email:
            raise ValidationError("a valid email is required")
        if level < 1 or level > ExperienceTable.MAX_LEVEL:
            raise ValidationError(
                f"level must be between 1 and {ExperienceTable.MAX_LEVEL}"
            )
        if experience < 0:
            raise ValidationError("experience cannot be negative")
        # Make sure the player exists before attempting the update so we return
        # NotFoundError consistently rather than a generic SQL outcome.
        self._players.get_by_id(player_id)
        return self._players.update_profile(
            player_id,
            username=username,
            email=email,
            level=level,
            experience=experience,
            has_chosen_starter=has_chosen_starter,
            location=location,
        )

    def adjust_pokecoins(
        self,
        player_id: int,
        *,
        delta: int | None,
        set_to: int | None,
        notes: str | None,
    ) -> Player:
        if (delta is None) == (set_to is None):
            raise ValidationError("provide exactly one of 'delta' or 'set_to'")
        player = self._players.get_by_id(player_id)
        if set_to is not None:
            if set_to < 0:
                raise ValidationError("pokecoin balance cannot be negative")
            delta = set_to - player.pokecoins
        assert delta is not None  # narrow for the type checker
        if delta == 0:
            return player
        if delta > 0:
            self._wallet.credit(
                player_id=player_id,
                amount=delta,
                transaction_type=WalletTransactionType.ADMIN_GRANT,
                notes=notes or "admin adjustment",
            )
        else:
            self._wallet.debit(
                player_id=player_id,
                amount=-delta,
                transaction_type=WalletTransactionType.ADMIN_GRANT,
                notes=notes or "admin adjustment",
            )
        return self._players.get_by_id(player_id)

    def reset_password(self, player_id: int, new_password: str) -> None:
        # Resolve to surface NotFoundError before we attempt the password reset.
        self._players.get_by_id(player_id)
        try:
            self._auth.reset_player_password(player_id, new_password)
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc

    def delete_user(self, player_id: int) -> None:
        self._players.get_by_id(player_id)
        self._players.delete(player_id)

    def list_transactions(
        self, player_id: int, *, limit: int, offset: int
    ) -> list[WalletTransaction]:
        # Validate the player exists so callers get a 404 if it does not.
        self._players.get_by_id(player_id)
        if limit < 1 or limit > 200:
            raise ValidationError("limit must be between 1 and 200")
        if offset < 0:
            raise ValidationError("offset must be non-negative")
        return self._transactions.list_for_player(
            player_id, limit=limit, offset=offset
        )
