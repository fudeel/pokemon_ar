# app/api/routers/wallet_router.py

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import container_dep, current_player
from app.api.presenters import wallet_transaction_to_model
from app.api.schemas.wallet import (
    WalletBalanceResponse,
    WalletTransactionPage,
)
from app.container import Container
from app.domain.characters.player import Player

router = APIRouter(prefix="/me/wallet", tags=["wallet"])


@router.get("/balance", response_model=WalletBalanceResponse)
def get_balance(
    player: Player = Depends(current_player),
    container: Container = Depends(container_dep),
) -> WalletBalanceResponse:
    """Returns the authenticated player's current pokecoin balance.

    The balance is owned by the server. The frontend never writes to it directly:
    it is changed only through reward grants (quest, gym, PvP, Stripe) and debits
    (merchant purchases) that the backend resolves.
    """
    pokecoins = container.wallet_service.get_balance(player.id)
    return WalletBalanceResponse(player_id=player.id, pokecoins=pokecoins)


@router.get("/transactions", response_model=WalletTransactionPage)
def list_transactions(
    player: Player = Depends(current_player),
    container: Container = Depends(container_dep),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> WalletTransactionPage:
    """Returns the authenticated player's pokecoin ledger, newest first."""
    transactions = container.wallet_service.list_transactions(
        player.id, limit=limit, offset=offset
    )
    items = [wallet_transaction_to_model(t) for t in transactions]
    return WalletTransactionPage(
        items=items, limit=limit, offset=offset, returned=len(items)
    )
