# app/services/auth_service.py

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.core.exceptions import AuthenticationError
from app.core.security import PasswordHasher, TokenGenerator
from app.domain.characters.player import Player
from app.repositories.admin_repository import AdminRepository
from app.repositories.auth_token_repository import AuthTokenRepository
from app.repositories.player_repository import PlayerRepository


@dataclass(frozen=True, slots=True)
class IssuedToken:
    token: str
    expires_at: datetime


class AuthService:
    def __init__(
        self,
        *,
        player_repository: PlayerRepository,
        admin_repository: AdminRepository,
        token_repository: AuthTokenRepository,
        password_hasher: PasswordHasher,
        token_generator: TokenGenerator,
        player_token_lifetime_seconds: int,
        admin_token_lifetime_seconds: int,
    ) -> None:
        self._players = player_repository
        self._admins = admin_repository
        self._tokens = token_repository
        self._hasher = password_hasher
        self._token_generator = token_generator
        self._player_lifetime = player_token_lifetime_seconds
        self._admin_lifetime = admin_token_lifetime_seconds

    def register_player(self, *, username: str, email: str, password: str) -> Player:
        if not username or not email or not password:
            raise ValueError("username, email and password are required")
        password_hash, password_salt = self._hasher.hash(password)
        return self._players.create(
            username=username,
            email=email,
            password_hash=password_hash,
            password_salt=password_salt,
        )

    def login_player(self, *, username: str, password: str) -> tuple[Player, IssuedToken]:
        credentials = self._players.get_credentials(username)
        if credentials is None:
            raise AuthenticationError("invalid credentials")
        player_id, password_hash, password_salt = credentials
        if not self._hasher.verify(password, password_hash, password_salt):
            raise AuthenticationError("invalid credentials")
        issued = self._issue_player_token(player_id)
        return self._players.get_by_id(player_id), issued

    def authenticate_player_token(self, token: str) -> Player:
        player_id = self._tokens.resolve_player(token)
        if player_id is None:
            raise AuthenticationError("invalid or expired token")
        return self._players.get_by_id(player_id)

    def logout_player(self, token: str) -> None:
        self._tokens.delete(token)

    def register_admin(self, *, username: str, password: str) -> int:
        password_hash, password_salt = self._hasher.hash(password)
        return self._admins.create(
            username=username, password_hash=password_hash, password_salt=password_salt
        )

    def login_admin(self, *, username: str, password: str) -> IssuedToken:
        credentials = self._admins.get_credentials(username)
        if credentials is None:
            raise AuthenticationError("invalid admin credentials")
        admin_id, password_hash, password_salt = credentials
        if not self._hasher.verify(password, password_hash, password_salt):
            raise AuthenticationError("invalid admin credentials")
        return self._issue_admin_token(admin_id)

    def authenticate_admin_token(self, token: str) -> int:
        admin_id = self._tokens.resolve_admin(token)
        if admin_id is None:
            raise AuthenticationError("invalid or expired admin token")
        return admin_id

    def admin_count(self) -> int:
        return self._admins.count()

    def _issue_player_token(self, player_id: int) -> IssuedToken:
        token = self._token_generator.new_token()
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=self._player_lifetime)
        self._tokens.store_player_token(token, player_id, expires_at)
        return IssuedToken(token=token, expires_at=expires_at)

    def _issue_admin_token(self, admin_id: int) -> IssuedToken:
        token = self._token_generator.new_token()
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=self._admin_lifetime)
        self._tokens.store_admin_token(token, admin_id, expires_at)
        return IssuedToken(token=token, expires_at=expires_at)
