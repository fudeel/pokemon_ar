# app/repositories/npc_repository.py

from __future__ import annotations

import json
import sqlite3

from app.core.exceptions import NotFoundError
from app.domain.characters.non_player_character import NonPlayerCharacter, NPCRole
from app.domain.world.geo_location import GeoLocation
from app.repositories.base_repository import BaseRepository


class NpcRepository(BaseRepository):
    def create(
        self,
        *,
        name: str,
        role: NPCRole,
        location: GeoLocation,
        dialogue: str | None,
        metadata: dict | None,
        created_by_admin_id: int | None,
    ) -> NonPlayerCharacter:
        with self.db.connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO npcs (name, role, lat, lng, dialogue, metadata, created_by_admin_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    name,
                    role.value,
                    location.latitude,
                    location.longitude,
                    dialogue,
                    json.dumps(metadata) if metadata else None,
                    created_by_admin_id,
                ),
            )
            row = conn.execute("SELECT * FROM npcs WHERE id = ?", (cursor.lastrowid,)).fetchone()
        return self._hydrate(row)

    def delete(self, npc_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute("DELETE FROM npcs WHERE id = ?", (npc_id,))
            if cursor.rowcount == 0:
                raise NotFoundError(f"npc {npc_id} not found")

    def get_by_id(self, npc_id: int) -> NonPlayerCharacter:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM npcs WHERE id = ?", (npc_id,)).fetchone()
        if row is None:
            raise NotFoundError(f"npc {npc_id} not found")
        return self._hydrate(row)

    def list_in_bounding_box(self, min_lat: float, max_lat: float, min_lng: float, max_lng: float) -> list[NonPlayerCharacter]:
        with self.db.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM npcs WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?",
                (min_lat, max_lat, min_lng, max_lng),
            ).fetchall()
        return [self._hydrate(row) for row in rows]

    def list_all(self) -> list[NonPlayerCharacter]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM npcs ORDER BY id").fetchall()
        return [self._hydrate(row) for row in rows]

    def _hydrate(self, row: sqlite3.Row) -> NonPlayerCharacter:
        return NonPlayerCharacter(
            npc_id=row["id"],
            name=row["name"],
            role=NPCRole(row["role"]),
            location=GeoLocation(latitude=row["lat"], longitude=row["lng"]),
            dialogue=row["dialogue"],
            metadata=json.loads(row["metadata"]) if row["metadata"] else {},
        )
