# app/repositories/admin_repository.py

from __future__ import annotations

import sqlite3

from app.core.exceptions import AlreadyExistsError
from app.repositories.base_repository import BaseRepository


class AdminRepository(BaseRepository):
    def create(self, *, username: str, password_hash: str, password_salt: str) -> int:
        try:
            with self.db.connection() as conn:
                cursor = conn.execute(
                    "INSERT INTO admins (username, password_hash, password_salt) VALUES (?, ?, ?)",
                    (username, password_hash, password_salt),
                )
                return cursor.lastrowid
        except sqlite3.IntegrityError as exc:
            raise AlreadyExistsError(f"admin username already taken: {exc}") from exc

    def get_credentials(self, username: str) -> tuple[int, str, str] | None:
        with self.db.connection() as conn:
            row = conn.execute(
                "SELECT id, password_hash, password_salt FROM admins WHERE username = ?",
                (username,),
            ).fetchone()
        if row is None:
            return None
        return row["id"], row["password_hash"], row["password_salt"]

    def count(self) -> int:
        with self.db.connection() as conn:
            row = conn.execute("SELECT COUNT(*) AS n FROM admins").fetchone()
        return row["n"]
