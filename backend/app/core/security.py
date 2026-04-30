# app/core/security.py

from __future__ import annotations

import hashlib
import hmac
import secrets


class PasswordHasher:
    """Salted scrypt password hashing using only the standard library."""

    _N = 2**14
    _R = 8
    _P = 1
    _DKLEN = 64
    _SALT_BYTES = 16

    def hash(self, password: str) -> tuple[str, str]:
        salt = secrets.token_bytes(self._SALT_BYTES)
        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=self._N,
            r=self._R,
            p=self._P,
            dklen=self._DKLEN,
        )
        return derived.hex(), salt.hex()

    def verify(self, password: str, password_hash_hex: str, salt_hex: str) -> bool:
        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=bytes.fromhex(salt_hex),
            n=self._N,
            r=self._R,
            p=self._P,
            dklen=self._DKLEN,
        )
        return hmac.compare_digest(derived.hex(), password_hash_hex)


class TokenGenerator:
    """Opaque random tokens (server-side validated against the database)."""

    def __init__(self, byte_length: int = 32) -> None:
        self._byte_length = byte_length

    def new_token(self) -> str:
        return secrets.token_urlsafe(self._byte_length)
