# app/repositories/world_item_spawn_repository.py

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone

from app.core.exceptions import AlreadyExistsError, NotFoundError
from app.domain.world.geo_location import GeoLocation
from app.domain.world.world_item_spawn import WorldItemSpawn
from app.repositories.base_repository import BaseRepository
from app.repositories.item_repository import ItemRepository


class WorldItemSpawnRepository(BaseRepository):
    def __init__(self, database, item_repository: ItemRepository) -> None:
        super().__init__(database)
        self._items = item_repository

    def create(
        self,
        *,
        item_id: int,
        quantity: int,
        location: GeoLocation,
        is_hidden: bool,
        expires_at: datetime | None,
        created_by_admin_id: int | None,
    ) -> WorldItemSpawn:
        with self.db.connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO world_item_spawns
                    (item_id, quantity, lat, lng, is_hidden, expires_at, created_by_admin_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item_id,
                    quantity,
                    location.latitude,
                    location.longitude,
                    int(is_hidden),
                    self.format_timestamp(expires_at) if expires_at else None,
                    created_by_admin_id,
                ),
            )
            row = conn.execute(
                "SELECT * FROM world_item_spawns WHERE id = ?", (cursor.lastrowid,)
            ).fetchone()
        return self._hydrate(row)

    def get_by_id(self, spawn_id: int) -> WorldItemSpawn:
        with self.db.connection() as conn:
            row = conn.execute(
                "SELECT * FROM world_item_spawns WHERE id = ?", (spawn_id,)
            ).fetchone()
        if row is None:
            raise NotFoundError(f"world_item_spawn {spawn_id} not found")
        return self._hydrate(row)

    def deactivate(self, spawn_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute(
                "UPDATE world_item_spawns SET is_active = 0 WHERE id = ?", (spawn_id,)
            )
        if cursor.rowcount == 0:
            raise NotFoundError(f"world_item_spawn {spawn_id} not found")

    def list_all_active(self) -> list[WorldItemSpawn]:
        with self.db.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM world_item_spawns WHERE is_active = 1 ORDER BY id"
            ).fetchall()
        return [self._hydrate(row) for row in rows]

    def list_active_in_bounding_box(
        self,
        *,
        instant: datetime,
        min_lat: float,
        max_lat: float,
        min_lng: float,
        max_lng: float,
    ) -> list[WorldItemSpawn]:
        ts = self.format_timestamp(instant)
        with self.db.connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM world_item_spawns
                WHERE is_active = 1
                  AND (expires_at IS NULL OR expires_at > ?)
                  AND lat BETWEEN ? AND ?
                  AND lng BETWEEN ? AND ?
                """,
                (ts, min_lat, max_lat, min_lng, max_lng),
            ).fetchall()
        return [self._hydrate(row) for row in rows]

    def record_collection(self, *, spawn_id: int, player_id: int) -> None:
        """Mark that a player collected this spawn. Raises AlreadyExistsError if already done."""
        try:
            with self.db.connection() as conn:
                conn.execute(
                    """
                    INSERT INTO world_item_collections (world_item_spawn_id, player_id)
                    VALUES (?, ?)
                    """,
                    (spawn_id, player_id),
                )
        except Exception as exc:
            if "UNIQUE constraint" in str(exc):
                raise AlreadyExistsError(
                    f"player {player_id} already collected world item spawn {spawn_id}"
                ) from exc
            raise

    def has_been_collected_by(self, spawn_id: int, player_id: int) -> bool:
        with self.db.connection() as conn:
            row = conn.execute(
                """
                SELECT 1 FROM world_item_collections
                WHERE world_item_spawn_id = ? AND player_id = ?
                """,
                (spawn_id, player_id),
            ).fetchone()
        return row is not None

    def _hydrate(self, row: sqlite3.Row) -> WorldItemSpawn:
        item = self._items.get_by_id(row["item_id"])
        return WorldItemSpawn(
            id=row["id"],
            item_id=item.id,
            item_name=item.name,
            item_category=item.category.value,
            quantity=row["quantity"],
            location=GeoLocation(latitude=row["lat"], longitude=row["lng"]),
            is_active=bool(row["is_active"]),
            is_hidden=bool(row["is_hidden"]),
            expires_at=self.parse_timestamp(row["expires_at"]),
            created_at=self.parse_timestamp(row["created_at"]) or datetime.now(timezone.utc),
        )
