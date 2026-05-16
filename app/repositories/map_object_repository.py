# app/repositories/map_object_repository.py

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError
from app.domain.world.geo_location import GeoLocation
from app.domain.world.map_object import MapObject
from app.repositories.base_repository import BaseRepository


class MapObjectRepository(BaseRepository):
    def create(
        self,
        *,
        kind: str,
        name: str | None,
        location: GeoLocation,
        metadata: dict | None,
        created_by_admin_id: int | None,
    ) -> MapObject:
        with self.db.connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO map_objects (kind, name, lat, lng, metadata, created_by_admin_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    kind,
                    name,
                    location.latitude,
                    location.longitude,
                    json.dumps(metadata) if metadata else None,
                    created_by_admin_id,
                ),
            )
            row = conn.execute("SELECT * FROM map_objects WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return self._hydrate(row)

    def delete(self, map_object_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute("DELETE FROM map_objects WHERE id = ?", (map_object_id,))
            if cursor.rowcount == 0:
                raise NotFoundError(f"map_object {map_object_id} not found")

    def list_in_bounding_box(self, min_lat: float, max_lat: float, min_lng: float, max_lng: float) -> list[MapObject]:
        with self.db.connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM map_objects
                WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
                """,
                (min_lat, max_lat, min_lng, max_lng),
            ).fetchall()
        return [self._hydrate(row) for row in rows]

    def list_all(self) -> list[MapObject]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM map_objects ORDER BY id").fetchall()
        return [self._hydrate(row) for row in rows]

    def _hydrate(self, row: sqlite3.Row) -> MapObject:
        return MapObject(
            id=row["id"],
            kind=row["kind"],
            name=row["name"],
            location=GeoLocation(latitude=row["lat"], longitude=row["lng"]),
            metadata=json.loads(row["metadata"]) if row["metadata"] else {},
            created_at=self.parse_timestamp(row["created_at"]) or datetime.now(timezone.utc),
            created_by_admin_id=row["created_by_admin_id"],
        )
