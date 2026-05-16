# app/repositories/gym_repository.py

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError
from app.domain.world.geo_location import GeoLocation
from app.domain.world.gym import Gym, GymDefender
from app.repositories.base_repository import BaseRepository


class GymRepository(BaseRepository):
    def create(
        self,
        *,
        name: str,
        location: GeoLocation,
        created_by_admin_id: int | None,
    ) -> Gym:
        with self.db.connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO gyms (name, lat, lng, created_by_admin_id)
                VALUES (?, ?, ?, ?)
                """,
                (name, location.latitude, location.longitude, created_by_admin_id),
            )
            return self.get_by_id(cursor.lastrowid)

    def delete(self, gym_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute("DELETE FROM gyms WHERE id = ?", (gym_id,))
            if cursor.rowcount == 0:
                raise NotFoundError(f"gym {gym_id} not found")

    def get_by_id(self, gym_id: int) -> Gym:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM gyms WHERE id = ?", (gym_id,)).fetchone()
        if row is None:
            raise NotFoundError(f"gym {gym_id} not found")
        return self._hydrate(row)

    def list_in_bounding_box(self, min_lat: float, max_lat: float, min_lng: float, max_lng: float) -> list[Gym]:
        with self.db.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM gyms WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?",
                (min_lat, max_lat, min_lng, max_lng),
            ).fetchall()
        return [self._hydrate(row) for row in rows]

    def list_all(self) -> list[Gym]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM gyms ORDER BY id").fetchall()
        return [self._hydrate(row) for row in rows]

    def set_leader(self, gym_id: int, player_id: int | None) -> None:
        with self.db.connection() as conn:
            conn.execute(
                """
                UPDATE gyms
                SET current_leader_player_id = ?, leader_since = CASE WHEN ? IS NULL THEN NULL ELSE datetime('now') END
                WHERE id = ?
                """,
                (player_id, player_id, gym_id),
            )

    def replace_defenders(self, gym_id: int, defenders: list[GymDefender]) -> None:
        with self.db.transaction() as conn:
            conn.execute("DELETE FROM gym_defenders WHERE gym_id = ?", (gym_id,))
            for defender in defenders:
                conn.execute(
                    """
                    INSERT INTO gym_defenders (gym_id, slot, pokemon_instance_id, effective_level)
                    VALUES (?, ?, ?, ?)
                    """,
                    (gym_id, defender.slot, defender.pokemon_instance_id, defender.effective_level),
                )

    def _load_defenders(self, gym_id: int) -> tuple[GymDefender, ...]:
        with self.db.connection() as conn:
            rows = conn.execute(
                "SELECT slot, pokemon_instance_id, effective_level, placed_at FROM gym_defenders WHERE gym_id = ? ORDER BY slot",
                (gym_id,),
            ).fetchall()
        return tuple(
            GymDefender(
                slot=row["slot"],
                pokemon_instance_id=row["pokemon_instance_id"],
                effective_level=row["effective_level"],
                placed_at=self.parse_timestamp(row["placed_at"]) or datetime.now(timezone.utc),
            )
            for row in rows
        )

    def _hydrate(self, row: sqlite3.Row) -> Gym:
        return Gym(
            id=row["id"],
            name=row["name"],
            location=GeoLocation(latitude=row["lat"], longitude=row["lng"]),
            current_leader_player_id=row["current_leader_player_id"],
            leader_since=self.parse_timestamp(row["leader_since"]),
            created_at=self.parse_timestamp(row["created_at"]) or datetime.now(timezone.utc),
            created_by_admin_id=row["created_by_admin_id"],
            defenders=self._load_defenders(row["id"]),
        )
