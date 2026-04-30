# app/repositories/player_repository.py

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone

from app.core.exceptions import AlreadyExistsError, NotFoundError
from app.domain.characters.player import Player
from app.domain.world.geo_location import GeoLocation
from app.repositories.base_repository import BaseRepository


class PlayerRepository(BaseRepository):
    def create(self, *, username: str, email: str, password_hash: str, password_salt: str) -> Player:
        try:
            with self.db.connection() as conn:
                cursor = conn.execute(
                    """
                    INSERT INTO players (username, email, password_hash, password_salt)
                    VALUES (?, ?, ?, ?)
                    """,
                    (username, email, password_hash, password_salt),
                )
                player_id = cursor.lastrowid
        except sqlite3.IntegrityError as exc:
            raise AlreadyExistsError(f"username or email already taken: {exc}") from exc
        return self.get_by_id(player_id)

    def get_by_id(self, player_id: int) -> Player:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM players WHERE id = ?", (player_id,)).fetchone()
        if row is None:
            raise NotFoundError(f"player {player_id} not found")
        return self._hydrate(row)

    def get_by_username(self, username: str) -> Player | None:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM players WHERE username = ?", (username,)).fetchone()
        return self._hydrate(row) if row else None

    def get_credentials(self, username: str) -> tuple[int, str, str] | None:
        """Returns (player_id, password_hash, password_salt) or None."""
        with self.db.connection() as conn:
            row = conn.execute(
                "SELECT id, password_hash, password_salt FROM players WHERE username = ?",
                (username,),
            ).fetchone()
        if row is None:
            return None
        return row["id"], row["password_hash"], row["password_salt"]

    def update_location(self, player_id: int, location: GeoLocation) -> None:
        with self.db.connection() as conn:
            conn.execute(
                """
                UPDATE players
                SET current_lat = ?, current_lng = ?, last_seen_at = datetime('now')
                WHERE id = ?
                """,
                (location.latitude, location.longitude, player_id),
            )

    def mark_starter_chosen(self, player_id: int) -> None:
        with self.db.connection() as conn:
            conn.execute("UPDATE players SET has_chosen_starter = 1 WHERE id = ?", (player_id,))

    def adjust_pokecoins(self, player_id: int, delta: int) -> int:
        with self.db.transaction() as conn:
            row = conn.execute("SELECT pokecoins FROM players WHERE id = ?", (player_id,)).fetchone()
            if row is None:
                raise NotFoundError(f"player {player_id} not found")
            new_balance = row["pokecoins"] + delta
            if new_balance < 0:
                raise ValueError("pokecoin balance cannot go negative")
            conn.execute("UPDATE players SET pokecoins = ? WHERE id = ?", (new_balance, player_id))
        return new_balance

    def add_experience(self, player_id: int, amount: int, new_level: int) -> None:
        with self.db.connection() as conn:
            conn.execute(
                "UPDATE players SET experience = experience + ?, level = ? WHERE id = ?",
                (amount, new_level, player_id),
            )

    def _hydrate(self, row: sqlite3.Row) -> Player:
        location: GeoLocation | None = None
        if row["current_lat"] is not None and row["current_lng"] is not None:
            location = GeoLocation(latitude=row["current_lat"], longitude=row["current_lng"])
        created_at = self.parse_timestamp(row["created_at"]) or datetime.now(timezone.utc)
        return Player(
            player_id=row["id"],
            username=row["username"],
            email=row["email"],
            level=row["level"],
            experience=row["experience"],
            pokecoins=row["pokecoins"],
            has_chosen_starter=bool(row["has_chosen_starter"]),
            location=location,
            last_seen_at=self.parse_timestamp(row["last_seen_at"]),
            created_at=created_at,
        )
