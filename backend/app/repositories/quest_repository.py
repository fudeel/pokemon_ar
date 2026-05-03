# app/repositories/quest_repository.py

from __future__ import annotations

import sqlite3
from dataclasses import dataclass

from app.core.exceptions import NotFoundError
from app.domain.pokemon.pokemon_type import PokemonType
from app.domain.quests.objective_type import QuestObjectiveType
from app.domain.quests.quest import Quest
from app.domain.quests.quest_objective import QuestObjective
from app.domain.quests.quest_reward import QuestItemReward, QuestReward
from app.domain.world.geo_location import GeoLocation
from app.repositories.base_repository import BaseRepository


@dataclass(frozen=True, slots=True)
class ObjectiveDraft:
    """Input shape used by callers to create or replace objectives."""

    objective_type: QuestObjectiveType
    description: str
    target_quantity: int
    target_item_id: int | None = None
    target_species_id: int | None = None
    target_pokemon_type: PokemonType | None = None
    target_npc_id: int | None = None
    target_location: GeoLocation | None = None
    target_radius_meters: float | None = None
    target_level: int | None = None


@dataclass(frozen=True, slots=True)
class ItemRewardDraft:
    item_id: int
    quantity: int


class QuestRepository(BaseRepository):
    """Persists quest definitions, their objectives, and item rewards."""

    def create(
        self,
        *,
        title: str,
        description: str,
        minimum_level: int,
        reward_pokecoins: int,
        reward_experience: int,
        time_limit_seconds: int | None,
        is_repeatable: bool,
        follow_up_quest_id: int | None,
        objectives: list[ObjectiveDraft],
        item_rewards: list[ItemRewardDraft],
        created_by_admin_id: int | None,
    ) -> Quest:
        with self.db.transaction() as conn:
            cursor = conn.execute(
                """
                INSERT INTO quests (
                    title, description, minimum_level,
                    reward_pokecoins, reward_experience,
                    time_limit_seconds, is_repeatable, follow_up_quest_id,
                    created_by_admin_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    title,
                    description,
                    minimum_level,
                    reward_pokecoins,
                    reward_experience,
                    time_limit_seconds,
                    int(is_repeatable),
                    follow_up_quest_id,
                    created_by_admin_id,
                ),
            )
            quest_id = cursor.lastrowid
            self._insert_objectives(conn, quest_id, objectives)
            self._insert_item_rewards(conn, quest_id, item_rewards)
        return self.get_by_id(quest_id)

    def update(
        self,
        *,
        quest_id: int,
        title: str,
        description: str,
        minimum_level: int,
        reward_pokecoins: int,
        reward_experience: int,
        time_limit_seconds: int | None,
        is_repeatable: bool,
        follow_up_quest_id: int | None,
        objectives: list[ObjectiveDraft],
        item_rewards: list[ItemRewardDraft],
    ) -> Quest:
        with self.db.transaction() as conn:
            updated = conn.execute(
                """
                UPDATE quests
                SET title = ?, description = ?, minimum_level = ?,
                    reward_pokecoins = ?, reward_experience = ?,
                    time_limit_seconds = ?, is_repeatable = ?,
                    follow_up_quest_id = ?
                WHERE id = ?
                """,
                (
                    title,
                    description,
                    minimum_level,
                    reward_pokecoins,
                    reward_experience,
                    time_limit_seconds,
                    int(is_repeatable),
                    follow_up_quest_id,
                    quest_id,
                ),
            )
            if updated.rowcount == 0:
                raise NotFoundError(f"quest {quest_id} not found")
            conn.execute("DELETE FROM quest_objectives WHERE quest_id = ?", (quest_id,))
            conn.execute("DELETE FROM quest_item_rewards WHERE quest_id = ?", (quest_id,))
            self._insert_objectives(conn, quest_id, objectives)
            self._insert_item_rewards(conn, quest_id, item_rewards)
        return self.get_by_id(quest_id)

    def delete(self, quest_id: int) -> None:
        with self.db.connection() as conn:
            cursor = conn.execute("DELETE FROM quests WHERE id = ?", (quest_id,))
        if cursor.rowcount == 0:
            raise NotFoundError(f"quest {quest_id} not found")

    def get_by_id(self, quest_id: int) -> Quest:
        with self.db.connection() as conn:
            row = conn.execute("SELECT * FROM quests WHERE id = ?", (quest_id,)).fetchone()
            if row is None:
                raise NotFoundError(f"quest {quest_id} not found")
            objectives = self._load_objectives(conn, quest_id)
            rewards = self._load_item_rewards(conn, quest_id)
        return self._hydrate(row, objectives, rewards)

    def list_all(self) -> list[Quest]:
        with self.db.connection() as conn:
            rows = conn.execute("SELECT * FROM quests ORDER BY id ASC").fetchall()
            quests: list[Quest] = []
            for row in rows:
                objectives = self._load_objectives(conn, row["id"])
                rewards = self._load_item_rewards(conn, row["id"])
                quests.append(self._hydrate(row, objectives, rewards))
        return quests

    def _insert_objectives(
        self,
        conn: sqlite3.Connection,
        quest_id: int,
        objectives: list[ObjectiveDraft],
    ) -> None:
        for index, objective in enumerate(objectives, start=1):
            location = objective.target_location
            conn.execute(
                """
                INSERT INTO quest_objectives (
                    quest_id, objective_order, objective_type, description,
                    target_quantity, target_item_id, target_species_id,
                    target_pokemon_type, target_npc_id,
                    target_lat, target_lng, target_radius_meters, target_level
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    quest_id,
                    index,
                    objective.objective_type.value,
                    objective.description,
                    objective.target_quantity,
                    objective.target_item_id,
                    objective.target_species_id,
                    objective.target_pokemon_type.value if objective.target_pokemon_type else None,
                    objective.target_npc_id,
                    location.latitude if location else None,
                    location.longitude if location else None,
                    objective.target_radius_meters,
                    objective.target_level,
                ),
            )

    def _insert_item_rewards(
        self,
        conn: sqlite3.Connection,
        quest_id: int,
        rewards: list[ItemRewardDraft],
    ) -> None:
        for reward in rewards:
            conn.execute(
                """
                INSERT INTO quest_item_rewards (quest_id, item_id, quantity)
                VALUES (?, ?, ?)
                """,
                (quest_id, reward.item_id, reward.quantity),
            )

    def _load_objectives(
        self, conn: sqlite3.Connection, quest_id: int
    ) -> list[QuestObjective]:
        rows = conn.execute(
            """
            SELECT * FROM quest_objectives
            WHERE quest_id = ?
            ORDER BY objective_order ASC
            """,
            (quest_id,),
        ).fetchall()
        return [self._hydrate_objective(row) for row in rows]

    def _load_item_rewards(
        self, conn: sqlite3.Connection, quest_id: int
    ) -> list[QuestItemReward]:
        rows = conn.execute(
            """
            SELECT qir.item_id, qir.quantity, i.name AS item_name
            FROM quest_item_rewards qir
            JOIN items i ON i.id = qir.item_id
            WHERE qir.quest_id = ?
            ORDER BY i.name ASC
            """,
            (quest_id,),
        ).fetchall()
        return [
            QuestItemReward(
                item_id=row["item_id"],
                item_name=row["item_name"],
                quantity=row["quantity"],
            )
            for row in rows
        ]

    def _hydrate(
        self,
        row: sqlite3.Row,
        objectives: list[QuestObjective],
        rewards: list[QuestItemReward],
    ) -> Quest:
        return Quest(
            id=row["id"],
            title=row["title"],
            description=row["description"],
            minimum_level=row["minimum_level"],
            time_limit_seconds=row["time_limit_seconds"],
            is_repeatable=bool(row["is_repeatable"]),
            follow_up_quest_id=row["follow_up_quest_id"],
            objectives=tuple(objectives),
            reward=QuestReward(
                pokecoins=row["reward_pokecoins"],
                experience=row["reward_experience"],
                items=tuple(rewards),
            ),
        )

    def _hydrate_objective(self, row: sqlite3.Row) -> QuestObjective:
        lat, lng = row["target_lat"], row["target_lng"]
        location = (
            GeoLocation(latitude=lat, longitude=lng)
            if lat is not None and lng is not None
            else None
        )
        type_value = row["target_pokemon_type"]
        return QuestObjective(
            id=row["id"],
            quest_id=row["quest_id"],
            order=row["objective_order"],
            objective_type=QuestObjectiveType(row["objective_type"]),
            description=row["description"],
            target_quantity=row["target_quantity"],
            target_item_id=row["target_item_id"],
            target_species_id=row["target_species_id"],
            target_pokemon_type=PokemonType(type_value) if type_value else None,
            target_npc_id=row["target_npc_id"],
            target_location=location,
            target_radius_meters=row["target_radius_meters"],
            target_level=row["target_level"],
        )
