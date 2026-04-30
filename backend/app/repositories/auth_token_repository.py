# app/repositories/auth_token_repository.py

from __future__ import annotations

from datetime import datetime, timezone

from app.repositories.base_repository import BaseRepository


class AuthTokenRepository(BaseRepository):
    def store_player_token(self, token: str, player_id: int, expires_at: datetime) -> None:
        with self.db.connection() as conn:
            conn.execute(
                "INSERT INTO auth_tokens (token, player_id, expires_at) VALUES (?, ?, ?)",
                (token, player_id, self.format_timestamp(expires_at)),
            )

    def resolve_player(self, token: str) -> int | None:
        with self.db.connection() as conn:
            row = conn.execute(
                "SELECT player_id, expires_at FROM auth_tokens WHERE token = ?",
                (token,),
            ).fetchone()
        if row is None:
            return None
        expires_at = self.parse_timestamp(row["expires_at"])
        if expires_at is None or expires_at <= datetime.now(timezone.utc):
            self.delete(token)
            return None
        return row["player_id"]

    def delete(self, token: str) -> None:
        with self.db.connection() as conn:
            conn.execute("DELETE FROM auth_tokens WHERE token = ?", (token,))

    def store_admin_token(self, token: str, admin_id: int, expires_at: datetime) -> None:
        with self.db.connection() as conn:
            conn.execute(
                "INSERT INTO admin_tokens (token, admin_id, expires_at) VALUES (?, ?, ?)",
                (token, admin_id, self.format_timestamp(expires_at)),
            )

    def resolve_admin(self, token: str) -> int | None:
        with self.db.connection() as conn:
            row = conn.execute(
                "SELECT admin_id, expires_at FROM admin_tokens WHERE token = ?",
                (token,),
            ).fetchone()
        if row is None:
            return None
        expires_at = self.parse_timestamp(row["expires_at"])
        if expires_at is None or expires_at <= datetime.now(timezone.utc):
            self.delete_admin(token)
            return None
        return row["admin_id"]

    def delete_admin(self, token: str) -> None:
        with self.db.connection() as conn:
            conn.execute("DELETE FROM admin_tokens WHERE token = ?", (token,))
