# app/repositories/pokemon_instance_repository.py

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from app.core.exceptions import NotFoundError
from app.domain.characters.stats import IndividualValues
from app.domain.pokemon.move import EquippedMove
from app.domain.pokemon.pokemon_instance import PokemonInstance, default_nerfs
from app.domain.world.geo_location import GeoLocation
from app.repositories.base_repository import BaseRepository
from app.repositories.move_repository import MoveRepository
from app.repositories.pokemon_species_repository import PokemonSpeciesRepository


class PokemonInstanceRepository(BaseRepository):
    def __init__(
        self,
        database,
        species_repository: PokemonSpeciesRepository,
        move_repository: MoveRepository,
    ) -> None:
        super().__init__(database)
        self._species_repository = species_repository
        self._move_repository = move_repository

    def insert(self, instance: PokemonInstance) -> PokemonInstance:
        max_hp = instance.effective_stats.max_hp
        if instance.current_hp > max_hp:
            instance.current_hp = max_hp
        with self.db.transaction() as conn:
            cursor = conn.execute(
                """
                INSERT INTO pokemon_instances (
                    species_id, owner_player_id, nickname, level, experience, current_hp,
                    iv_hp, iv_attack, iv_defense, iv_special_attack, iv_special_defense, iv_speed,
                    nerfs, caught_lat, caught_lng
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    instance.species.id,
                    instance.owner_player_id,
                    instance.nickname,
                    instance.level,
                    instance.experience,
                    instance.current_hp,
                    instance.ivs.hp,
                    instance.ivs.attack,
                    instance.ivs.defense,
                    instance.ivs.special_attack,
                    instance.ivs.special_defense,
                    instance.ivs.speed,
                    json.dumps(instance.nerfs),
                    instance.caught_location.latitude if instance.caught_location else None,
                    instance.caught_location.longitude if instance.caught_location else None,
                ),
            )
            instance.id = cursor.lastrowid
            for equipped in instance.moves:
                conn.execute(
                    """
                    INSERT INTO pokemon_instance_moves (pokemon_instance_id, slot, move_id, current_pp)
                    VALUES (?, ?, ?, ?)
                    """,
                    (instance.id, equipped.slot, equipped.move.id, equipped.current_pp),
                )
        return instance

    def get_by_id(self, pokemon_instance_id: int) -> PokemonInstance:
        with self.db.connection() as conn:
            row = conn.execute(
                "SELECT * FROM pokemon_instances WHERE id = ?", (pokemon_instance_id,)
            ).fetchone()
        if row is None:
            raise NotFoundError(f"pokemon_instance {pokemon_instance_id} not found")
        return self._hydrate(row)

    def list_for_player(self, player_id: int) -> list[PokemonInstance]:
        with self.db.connection() as conn:
            rows = conn.execute(
                "SELECT * FROM pokemon_instances WHERE owner_player_id = ? ORDER BY id", (player_id,)
            ).fetchall()
        return [self._hydrate(row) for row in rows]

    def update_hp_and_experience(self, instance: PokemonInstance) -> None:
        with self.db.connection() as conn:
            conn.execute(
                """
                UPDATE pokemon_instances
                SET current_hp = ?, experience = ?, level = ?
                WHERE id = ?
                """,
                (instance.current_hp, instance.experience, instance.level, instance.id),
            )

    def _hydrate(self, row: sqlite3.Row) -> PokemonInstance:
        species = self._species_repository.get_by_id(row["species_id"])
        ivs = IndividualValues(
            hp=row["iv_hp"],
            attack=row["iv_attack"],
            defense=row["iv_defense"],
            special_attack=row["iv_special_attack"],
            special_defense=row["iv_special_defense"],
            speed=row["iv_speed"],
        )
        with self.db.connection() as conn:
            move_rows = conn.execute(
                "SELECT slot, move_id, current_pp FROM pokemon_instance_moves WHERE pokemon_instance_id = ? ORDER BY slot",
                (row["id"],),
            ).fetchall()
        moves = [
            EquippedMove(
                move=self._move_repository.get_by_id(mr["move_id"]),
                slot=mr["slot"],
                current_pp=mr["current_pp"],
            )
            for mr in move_rows
        ]
        caught_location: GeoLocation | None = None
        if row["caught_lat"] is not None and row["caught_lng"] is not None:
            caught_location = GeoLocation(latitude=row["caught_lat"], longitude=row["caught_lng"])
        caught_at = self.parse_timestamp(row["caught_at"]) or datetime.now(timezone.utc)
        nerfs = default_nerfs()
        raw_nerfs = row["nerfs"] if "nerfs" in row.keys() else None
        if raw_nerfs:
            try:
                stored = json.loads(raw_nerfs)
                if isinstance(stored, dict):
                    nerfs.update(stored)
            except json.JSONDecodeError:
                pass
        return PokemonInstance(
            id=row["id"],
            species=species,
            owner_player_id=row["owner_player_id"],
            nickname=row["nickname"],
            level=row["level"],
            experience=row["experience"],
            current_hp=row["current_hp"],
            ivs=ivs,
            moves=moves,
            caught_at=caught_at,
            caught_location=caught_location,
            nerfs=nerfs,
        )
