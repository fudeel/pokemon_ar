# app/repositories/spawn_area_repository.py

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError
from app.domain.pokemon.pokemon_type import PokemonType
from app.domain.world.geo_location import GeoLocation
from app.domain.world.polygon import (
    bounding_radius_meters,
    centroid,
    hydrate_polygon,
    serialize_polygon,
)
from app.domain.world.spawn_area import SpawnArea, SpawnAreaPokemon
from app.repositories.base_repository import BaseRepository


class SpawnAreaRepository(BaseRepository):
    def create(
        self,
        *,
        name: str,
        polygon: tuple[GeoLocation, ...],
        primary_type: PokemonType,
        secondary_type: PokemonType | None,
        spawn_weight: float,
        created_by_admin_id: int | None,
    ) -> SpawnArea:
        center = centroid(polygon)
        radius = bounding_radius_meters(polygon, center)
        with self.db.connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO spawn_areas (
                    name, center_lat, center_lng, radius_meters, polygon_points,
                    primary_type, secondary_type, spawn_weight, created_by_admin_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    name,
                    center.latitude,
                    center.longitude,
                    radius,
                    serialize_polygon(polygon),
                    primary_type.value,
                    secondary_type.value if secondary_type else None,
                    spawn_weight,
                    created_by_admin_id,
                ),
            )
            area_id = cursor.lastrowid
            row = conn.execute("SELECT * FROM spawn_areas WHERE id = ?", (area_id,)).fetchone()
        return self._hydrate(row, [])

    def set_pokemon(self, spawn_area_id: int, entries: list[tuple[int, float]]) -> list[SpawnAreaPokemon]:
        """Replace the full pokemon list for a spawn area. entries = [(species_id, spawn_chance), ...]"""
        with self.db.transaction() as conn:
            conn.execute("DELETE FROM spawn_area_pokemon WHERE spawn_area_id = ?", (spawn_area_id,))
            for species_id, spawn_chance in entries:
                conn.execute(
                    "INSERT INTO spawn_area_pokemon (spawn_area_id, species_id, spawn_chance) VALUES (?, ?, ?)",
                    (spawn_area_id, species_id, spawn_chance),
                )
        return self._load_pokemon(spawn_area_id)

    def get_by_id(self, spawn_area_id: int) -> SpawnArea:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM spawn_areas WHERE id = ?", (spawn_area_id,)).fetchone()
        if row is None:
            raise NotFoundError(f"spawn_area {spawn_area_id} not found")
        return self._hydrate(row, self._load_pokemon(spawn_area_id))

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
        return [self._hydrate(row, self._load_pokemon(row["id"])) for row in rows]

    def list_all(self) -> list[SpawnArea]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM spawn_areas ORDER BY id").fetchall()
        return [self._hydrate(row, self._load_pokemon(row["id"])) for row in rows]

    # ── private ──────────────────────────────────────────────────────────────

    def _load_pokemon(self, spawn_area_id: int) -> list[SpawnAreaPokemon]:
        with self.db.connection() as conn:
            rows = conn.execute(
                """
                SELECT sap.species_id, ps.name AS species_name, sap.spawn_chance
                FROM spawn_area_pokemon sap
                JOIN pokemon_species ps ON ps.id = sap.species_id
                WHERE sap.spawn_area_id = ?
                ORDER BY sap.spawn_chance DESC
                """,
                (spawn_area_id,),
            ).fetchall()
        return [
            SpawnAreaPokemon(
                species_id=row["species_id"],
                species_name=row["species_name"],
                spawn_chance=row["spawn_chance"],
            )
            for row in rows
        ]

    def _hydrate(self, row: sqlite3.Row, pokemon: list[SpawnAreaPokemon]) -> SpawnArea:
        polygon = hydrate_polygon(
            payload=row["polygon_points"],
            fallback_center=GeoLocation(latitude=row["center_lat"], longitude=row["center_lng"]),
            fallback_radius_meters=row["radius_meters"],
        )
        return SpawnArea(
            id=row["id"],
            name=row["name"],
            polygon=polygon,
            primary_type=PokemonType(row["primary_type"]),
            secondary_type=PokemonType(row["secondary_type"]) if row["secondary_type"] else None,
            spawn_weight=row["spawn_weight"],
            pokemon=pokemon,
            created_at=self.parse_timestamp(row["created_at"]) or datetime.now(timezone.utc),
            created_by_admin_id=row["created_by_admin_id"],
        )
