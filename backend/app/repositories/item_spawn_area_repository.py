# app/repositories/item_spawn_area_repository.py

from __future__ import annotations

import sqlite3

from app.core.exceptions import NotFoundError
from app.domain.world.geo_location import GeoLocation
from app.domain.world.item_spawn_area import ItemSpawnArea, ItemSpawnAreaEntry
from app.repositories.base_repository import BaseRepository
from app.repositories.item_repository import ItemRepository


class ItemSpawnAreaRepository(BaseRepository):
    def __init__(self, database, item_repository: ItemRepository) -> None:
        super().__init__(database)
        self._items = item_repository

    def create(
        self,
        *,
        name: str,
        center: GeoLocation,
        radius_meters: float,
        created_by_admin_id: int | None,
    ) -> ItemSpawnArea:
        with self.db.connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO item_spawn_areas (name, center_lat, center_lng, radius_meters, created_by_admin_id)
                VALUES (?, ?, ?, ?, ?)
                """,
                (name, center.latitude, center.longitude, radius_meters, created_by_admin_id),
            )
        return self.get_by_id(cursor.lastrowid)

    def delete(self, area_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute("DELETE FROM item_spawn_areas WHERE id = ?", (area_id,))
        if cursor.rowcount == 0:
            raise NotFoundError(f"item_spawn_area {area_id} not found")

    def get_by_id(self, area_id: int) -> ItemSpawnArea:
        with self.db.connection() as conn:
            row = conn.execute(
                "SELECT * FROM item_spawn_areas WHERE id = ?", (area_id,)
            ).fetchone()
            if row is None:
                raise NotFoundError(f"item_spawn_area {area_id} not found")
            entries = self._load_entries(conn, area_id)
        return self._hydrate(row, entries)

    def set_items(
        self,
        area_id: int,
        entries: list[tuple[int, float, int]],  # (item_id, spawn_chance, max_quantity)
    ) -> ItemSpawnArea:
        with self.db.transaction() as conn:
            conn.execute(
                "DELETE FROM item_spawn_area_items WHERE spawn_area_id = ?", (area_id,)
            )
            conn.executemany(
                """
                INSERT INTO item_spawn_area_items
                    (spawn_area_id, item_id, spawn_chance, max_quantity)
                VALUES (?, ?, ?, ?)
                """,
                [(area_id, item_id, chance, qty) for item_id, chance, qty in entries],
            )
        return self.get_by_id(area_id)

    def list_all(self) -> list[ItemSpawnArea]:
        with self.db.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM item_spawn_areas ORDER BY id"
            ).fetchall()
            areas: list[ItemSpawnArea] = []
            for row in rows:
                entries = self._load_entries(conn, row["id"])
                areas.append(self._hydrate(row, entries))
        return areas

    def list_in_bounding_box(
        self,
        *,
        min_lat: float,
        max_lat: float,
        min_lng: float,
        max_lng: float,
    ) -> list[ItemSpawnArea]:
        with self.db.connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM item_spawn_areas
                WHERE center_lat BETWEEN ? AND ?
                  AND center_lng BETWEEN ? AND ?
                """,
                (min_lat, max_lat, min_lng, max_lng),
            ).fetchall()
            areas: list[ItemSpawnArea] = []
            for row in rows:
                entries = self._load_entries(conn, row["id"])
                areas.append(self._hydrate(row, entries))
        return areas

    def _load_entries(
        self, conn: sqlite3.Connection, area_id: int
    ) -> list[ItemSpawnAreaEntry]:
        rows = conn.execute(
            """
            SELECT isai.item_id, isai.spawn_chance, isai.max_quantity,
                   i.name AS item_name, i.category AS item_category
            FROM item_spawn_area_items isai
            JOIN items i ON i.id = isai.item_id
            WHERE isai.spawn_area_id = ?
            ORDER BY i.name
            """,
            (area_id,),
        ).fetchall()
        return [
            ItemSpawnAreaEntry(
                item_id=row["item_id"],
                item_name=row["item_name"],
                item_category=row["item_category"],
                spawn_chance=row["spawn_chance"],
                max_quantity=row["max_quantity"],
            )
            for row in rows
        ]

    def _hydrate(
        self, row: sqlite3.Row, entries: list[ItemSpawnAreaEntry]
    ) -> ItemSpawnArea:
        return ItemSpawnArea(
            id=row["id"],
            name=row["name"],
            center=GeoLocation(latitude=row["center_lat"], longitude=row["center_lng"]),
            radius_meters=row["radius_meters"],
            items=tuple(entries),
        )
