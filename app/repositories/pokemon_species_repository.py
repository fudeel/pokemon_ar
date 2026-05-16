# app/repositories/pokemon_species_repository.py

from __future__ import annotations

import sqlite3

from app.core.exceptions import AlreadyExistsError, NotFoundError
from app.domain.characters.stats import BaseStats
from app.domain.pokemon.pokemon_species import PokemonSpecies
from app.domain.pokemon.pokemon_type import PokemonType
from app.repositories.base_repository import BaseRepository


class PokemonSpeciesRepository(BaseRepository):
    def upsert(self, species: PokemonSpecies) -> PokemonSpecies:
        try:
            with self.db.connection() as conn:
                conn.execute(
                    """
                    INSERT INTO pokemon_species (
                        id, name, primary_type, secondary_type,
                        base_hp, base_attack, base_defense,
                        base_special_attack, base_special_defense, base_speed,
                        capture_rate, base_experience, is_starter, is_rare
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        name=excluded.name,
                        primary_type=excluded.primary_type,
                        secondary_type=excluded.secondary_type,
                        base_hp=excluded.base_hp,
                        base_attack=excluded.base_attack,
                        base_defense=excluded.base_defense,
                        base_special_attack=excluded.base_special_attack,
                        base_special_defense=excluded.base_special_defense,
                        base_speed=excluded.base_speed,
                        capture_rate=excluded.capture_rate,
                        base_experience=excluded.base_experience,
                        is_starter=excluded.is_starter,
                        is_rare=excluded.is_rare
                    """,
                    (
                        species.id,
                        species.name,
                        species.primary_type.value,
                        species.secondary_type.value if species.secondary_type else None,
                        species.base_stats.hp,
                        species.base_stats.attack,
                        species.base_stats.defense,
                        species.base_stats.special_attack,
                        species.base_stats.special_defense,
                        species.base_stats.speed,
                        species.capture_rate,
                        species.base_experience,
                        int(species.is_starter),
                        int(species.is_rare),
                    ),
                )
        except sqlite3.IntegrityError as exc:
            raise AlreadyExistsError(str(exc)) from exc
        return self.get_by_id(species.id)

    def get_by_id(self, species_id: int) -> PokemonSpecies:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM pokemon_species WHERE id = ?", (species_id,)).fetchone()
        if row is None:
            raise NotFoundError(f"species {species_id} not found")
        return self._hydrate(row)

    def list_all(self) -> list[PokemonSpecies]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM pokemon_species ORDER BY id").fetchall()
        return [self._hydrate(row) for row in rows]

    def list_starters(self) -> list[PokemonSpecies]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM pokemon_species WHERE is_starter = 1 ORDER BY id").fetchall()
        return [self._hydrate(row) for row in rows]

    def _hydrate(self, row: sqlite3.Row) -> PokemonSpecies:
        return PokemonSpecies(
            id=row["id"],
            name=row["name"],
            primary_type=PokemonType(row["primary_type"]),
            secondary_type=PokemonType(row["secondary_type"]) if row["secondary_type"] else None,
            base_stats=BaseStats(
                hp=row["base_hp"],
                attack=row["base_attack"],
                defense=row["base_defense"],
                special_attack=row["base_special_attack"],
                special_defense=row["base_special_defense"],
                speed=row["base_speed"],
            ),
            capture_rate=row["capture_rate"],
            base_experience=row["base_experience"],
            is_starter=bool(row["is_starter"]),
            is_rare=bool(row["is_rare"]),
        )
