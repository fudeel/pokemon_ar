# app/repositories/spawn_area_repository.py

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError
from app.domain.pokemon.pokemon_type import PokemonType
from app.domain.world.geo_location import GeoLocation
from app.domain.world.spawn_area import SpawnArea
from app.repositories.base_repository import BaseRepository


class SpawnAreaRepository(BaseRepository):
    def create(
        self,
        *,
        name: str,
        center: GeoLocation,
        radius_meters: float,
        primary_type: PokemonType,
        secondary_type: PokemonType | None,
        spawn_weight: float,
        created_by_admin_id: int | None,
    ) -> SpawnArea:
        with self.db.connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO spawn_areas (
                    name, center_lat, center_lng, radius_meters,
                    primary_type, secondary_type, spawn_weight, created_by_admin_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    name,
                    center.latitude,
                    center.longitude,
                    radius_meters,
                    primary_type.value,
                    secondary_type.value if secondary_type else None,
                    spawn_weight,
                    created_by_admin_id,
                ),
            )
            row = conn.execute("SELECT * FROM spawn_areas WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return self._hydrate(row)

    def delete(self, spawn_area_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute("DELETE FROM spawn_areas WHERE id = ?", (spawn_area_id,))
            if cursor.rowcount == 0:
                raise NotFoundError(f"spawn_area {spawn_area_id} not found")

    def list_in_bounding_box(self, min_lat: float, max_lat: float, min_lng: float, max_lng: float) -> list[SpawnArea]:
        with self.db.connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM spawn_areas
                WHERE center_lat BETWEEN ? AND ? AND center_lng BETWEEN ? AND ?
                """,
                (min_lat, max_lat, min_lng, max_lng),
            ).fetchall()
        return [self._hydrate(row) for row in rows]

    def list_all(self) -> list[SpawnArea]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM spawn_areas ORDER BY id").fetchall()
        return [self._hydrate(row) for row in rows]

    def _hydrate(self, row: sqlite3.Row) -> SpawnArea:
        return SpawnArea(
            id=row["id"],
            name=row["name"],
            center=GeoLocation(latitude=row["center_lat"], longitude=row["center_lng"]),
            radius_meters=row["radius_meters"],
            primary_type=PokemonType(row["primary_type"]),
            secondary_type=PokemonType(row["secondary_type"]) if row["secondary_type"] else None,
            spawn_weight=row["spawn_weight"],
            created_at=self.parse_timestamp(row["created_at"]) or datetime.now(timezone.utc),
            created_by_admin_id=row["created_by_admin_id"],
        )
