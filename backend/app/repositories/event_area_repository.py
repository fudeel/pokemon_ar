# app/repositories/event_area_repository.py

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError
from app.domain.world.event_area import EventArea
from app.domain.world.geo_location import GeoLocation
from app.repositories.base_repository import BaseRepository


class EventAreaRepository(BaseRepository):
    def create(
        self,
        *,
        name: str,
        description: str | None,
        center: GeoLocation,
        radius_meters: float,
        starts_at: datetime,
        ends_at: datetime,
        metadata: dict | None,
        created_by_admin_id: int | None,
    ) -> EventArea:
        with self.db.connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO event_areas (
                    name, description, center_lat, center_lng, radius_meters,
                    starts_at, ends_at, metadata, created_by_admin_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    name,
                    description,
                    center.latitude,
                    center.longitude,
                    radius_meters,
                    self.format_timestamp(starts_at),
                    self.format_timestamp(ends_at),
                    json.dumps(metadata) if metadata else None,
                    created_by_admin_id,
                ),
            )
            row = conn.execute("SELECT * FROM event_areas WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return self._hydrate(row)

    def delete(self, event_area_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute("DELETE FROM event_areas WHERE id = ?", (event_area_id,))
            if cursor.rowcount == 0:
                raise NotFoundError(f"event_area {event_area_id} not found")

    def list_active_in_bounding_box(
        self,
        *,
        instant: datetime,
        min_lat: float,
        max_lat: float,
        min_lng: float,
        max_lng: float,
    ) -> list[EventArea]:
        ts = self.format_timestamp(instant)
        with self.db.connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM event_areas
                WHERE starts_at <= ? AND ends_at > ?
                  AND center_lat BETWEEN ? AND ?
                  AND center_lng BETWEEN ? AND ?
                """,
                (ts, ts, min_lat, max_lat, min_lng, max_lng),
            ).fetchall()
        return [self._hydrate(row) for row in rows]

    def list_all(self) -> list[EventArea]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM event_areas ORDER BY id").fetchall()
        return [self._hydrate(row) for row in rows]

    def _hydrate(self, row: sqlite3.Row) -> EventArea:
        starts_at = self.parse_timestamp(row["starts_at"]) or datetime.now(timezone.utc)
        ends_at = self.parse_timestamp(row["ends_at"]) or datetime.now(timezone.utc)
        return EventArea(
            id=row["id"],
            name=row["name"],
            description=row["description"],
            center=GeoLocation(latitude=row["center_lat"], longitude=row["center_lng"]),
            radius_meters=row["radius_meters"],
            starts_at=starts_at,
            ends_at=ends_at,
            metadata=json.loads(row["metadata"]) if row["metadata"] else {},
            created_at=self.parse_timestamp(row["created_at"]) or datetime.now(timezone.utc),
            created_by_admin_id=row["created_by_admin_id"],
        )
