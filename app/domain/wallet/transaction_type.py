# app/domain/wallet/transaction_type.py

from __future__ import annotations

from enum import Enum


class WalletTransactionType(str, Enum):
    """Reason a player's pokecoin balance changed.

    Credits are positive amounts; debits are negative. The type identifies
    the originating system so the ledger can be audited and reconciled.
    """

    QUEST_REWARD = "quest_reward"
    GYM_REWARD = "gym_reward"
    PVP_REWARD = "pvp_reward"
    STRIPE_PURCHASE = "stripe_purchase"
    MERCHANT_PURCHASE = "merchant_purchase"
    ADMIN_GRANT = "admin_grant"
    REFUND = "refund"
