# app/repositories/wild_pokemon_repository.py

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError
from app.domain.characters.wild_pokemon import WildPokemon
from app.domain.world.geo_location import GeoLocation
from app.repositories.base_repository import BaseRepository
from app.repositories.pokemon_species_repository import PokemonSpeciesRepository


class WildPokemonRepository(BaseRepository):
    def __init__(self, database, species_repository: PokemonSpeciesRepository) -> None:
        super().__init__(database)
        self._species_repository = species_repository

    def create(
        self,
        *,
        species_id: int,
        level: int,
        location: GeoLocation,
        current_hp: int,
        expires_at: datetime | None,
        created_by_admin_id: int | None,
    ) -> WildPokemon:
        with self.db.connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO rare_wild_pokemon (
                    species_id, level, lat, lng, current_hp, expires_at, created_by_admin_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    species_id,
                    level,
                    location.latitude,
                    location.longitude,
                    current_hp,
                    self.format_timestamp(expires_at) if expires_at else None,
                    created_by_admin_id,
                ),
            )
            row = conn.execute("SELECT * FROM rare_wild_pokemon WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return self._hydrate(row)

    def get_by_id(self, wild_id: int) -> WildPokemon:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM rare_wild_pokemon WHERE id = ?", (wild_id,)).fetchone()
        if row is None:
            raise NotFoundError(f"rare_wild_pokemon {wild_id} not found")
        return self._hydrate(row)

    def deactivate(self, wild_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute(
                "UPDATE rare_wild_pokemon SET is_active = 0 WHERE id = ?", (wild_id,)
            )
            if cursor.rowcount == 0:
                raise NotFoundError(f"rare_wild_pokemon {wild_id} not found")

    def record_capture(self, *, rare_pokemon_id: int, player_id: int, pokemon_instance_id: int) -> None:
        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO rare_pokemon_captures (rare_pokemon_id, captured_by_player_id, pokemon_instance_id)
                VALUES (?, ?, ?)
                """,
                (rare_pokemon_id, player_id, pokemon_instance_id),
            )

    def list_active_in_bounding_box(
        self,
        *,
        instant: datetime,
        min_lat: float,
        max_lat: float,
        min_lng: float,
        max_lng: float,
    ) -> list[WildPokemon]:
        ts = self.format_timestamp(instant)
        with self.db.connection() as conn:
            rows = conn.execute(
                """
                SELECT * FROM rare_wild_pokemon
                WHERE is_active = 1
                  AND (expires_at IS NULL OR expires_at > ?)
                  AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
                """,
                (ts, min_lat, max_lat, min_lng, max_lng),
            ).fetchall()
        return [self._hydrate(row) for row in rows]

    def list_all_active(self) -> list[WildPokemon]:
        with self.db.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM rare_wild_pokemon WHERE is_active = 1 ORDER BY id"
            ).fetchall()
        return [self._hydrate(row) for row in rows]

    def _hydrate(self, row: sqlite3.Row) -> WildPokemon:
        species = self._species_repository.get_by_id(row["species_id"])
        return WildPokemon(
            wild_id=row["id"],
            species_id=species.id,
            species_name=species.name,
            level=row["level"],
            current_hp=row["current_hp"],
            location=GeoLocation(latitude=row["lat"], longitude=row["lng"]),
            is_active=bool(row["is_active"]),
            expires_at=self.parse_timestamp(row["expires_at"]),
            created_at=self.parse_timestamp(row["created_at"]) or datetime.now(timezone.utc),
        )
