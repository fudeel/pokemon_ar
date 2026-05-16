# app/repositories/move_repository.py

from __future__ import annotations

import sqlite3

from app.core.exceptions import NotFoundError
from app.domain.pokemon.move import LearnableMove, Move, MoveCategory
from app.domain.pokemon.pokemon_type import PokemonType
from app.repositories.base_repository import BaseRepository


class MoveRepository(BaseRepository):
    def upsert(self, *, name: str, type_: PokemonType, category: MoveCategory, power: int | None, accuracy: int | None, pp: int) -> Move:
        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO moves (name, type, category, power, accuracy, pp)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(name) DO UPDATE SET
                    type=excluded.type, category=excluded.category,
                    power=excluded.power, accuracy=excluded.accuracy, pp=excluded.pp
                """,
                (name, type_.value, category.value, power, accuracy, pp),
            )
            row = conn.execute("SELECT * FROM moves WHERE name = ?", (name,)).fetchone()
        return self._hydrate(row)

    def get_by_id(self, move_id: int) -> Move:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM moves WHERE id = ?", (move_id,)).fetchone()
        if row is None:
            raise NotFoundError(f"move {move_id} not found")
        return self._hydrate(row)

    def list_learnable_for_species(self, species_id: int, max_level: int) -> list[LearnableMove]:
        with self.db.connection() as conn:
            rows = conn.execute(
                """
                SELECT m.*, slm.learn_level
                FROM species_learnable_moves slm
                JOIN moves m ON m.id = slm.move_id
                WHERE slm.species_id = ? AND slm.learn_level <= ?
                ORDER BY slm.learn_level ASC, m.id ASC
                """,
                (species_id, max_level),
            ).fetchall()
        return [LearnableMove(move=self._hydrate(row), learn_level=row["learn_level"]) for row in rows]

    def delete(self, move_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute("DELETE FROM moves WHERE id = ?", (move_id,))
        if cursor.rowcount == 0:
            raise NotFoundError(f"move {move_id} not found")

    def list_all(self) -> list[Move]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM moves ORDER BY name ASC").fetchall()
        return [self._hydrate(row) for row in rows]

    def list_learnable_all_for_species(self, species_id: int) -> list[LearnableMove]:
        with self.db.connection() as conn:
            rows = conn.execute(
                """
                SELECT m.*, slm.learn_level
                FROM species_learnable_moves slm
                JOIN moves m ON m.id = slm.move_id
                WHERE slm.species_id = ?
                ORDER BY slm.learn_level ASC, m.id ASC
                """,
                (species_id,),
            ).fetchall()
        return [LearnableMove(move=self._hydrate(row), learn_level=row["learn_level"]) for row in rows]

    def set_learnable_for_species(
        self, species_id: int, entries: list[tuple[int, int]]
    ) -> list[LearnableMove]:
        """Replace all learnable moves for a species. entries = [(move_id, learn_level), ...]"""
        with self.db.connection() as conn:
            conn.execute(
                "DELETE FROM species_learnable_moves WHERE species_id = ?", (species_id,)
            )
            conn.executemany(
                """
                INSERT INTO species_learnable_moves (species_id, move_id, learn_level)
                VALUES (?, ?, ?)
                """,
                [(species_id, move_id, learn_level) for move_id, learn_level in entries],
            )
        return self.list_learnable_all_for_species(species_id)

    def attach_to_species(self, *, species_id: int, move_id: int, learn_level: int) -> None:
        with self.db.connection() as conn:
            conn.execute(
                """
                INSERT INTO species_learnable_moves (species_id, move_id, learn_level)
                VALUES (?, ?, ?)
                ON CONFLICT(species_id, move_id) DO UPDATE SET learn_level=excluded.learn_level
                """,
                (species_id, move_id, learn_level),
            )

    def _hydrate(self, row: sqlite3.Row) -> Move:
        return Move(
            id=row["id"],
            name=row["name"],
            type=PokemonType(row["type"]),
            category=MoveCategory(row["category"]),
            power=row["power"],
            accuracy=row["accuracy"],
            pp=row["pp"],
        )
