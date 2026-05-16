# app/core/database.py

from __future__ import annotations

import sqlite3
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path


class Database:
    """Thread-safe SQLite connection provider with per-thread connections."""

    def __init__(self, db_path: Path, schema_path: Path) -> None:
        self._db_path = db_path
        self._schema_path = schema_path
        self._local = threading.local()
        self._db_path.parent.mkdir(parents=True, exist_ok=True)

    def _get_connection(self) -> sqlite3.Connection:
        conn = getattr(self._local, "conn", None)
        if conn is None:
            conn = sqlite3.connect(
                self._db_path,
                detect_types=sqlite3.PARSE_DECLTYPES,
                check_same_thread=False,
                isolation_level=None,
            )
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA foreign_keys = ON")
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute("PRAGMA synchronous = NORMAL")
            self._local.conn = conn
        return conn

    def initialize_schema(self) -> None:
        sql = self._schema_path.read_text(encoding="utf-8")
        conn = self._get_connection()
        conn.executescript(sql)
        self._apply_runtime_migrations(conn)

    @staticmethod
    def _apply_runtime_migrations(conn: sqlite3.Connection) -> None:
        """Idempotent column additions for tables that pre-existed before a column was added."""
        additions = (
            ("spawn_areas", "polygon_points", "TEXT"),
            ("event_areas", "polygon_points", "TEXT"),
            ("item_spawn_areas", "polygon_points", "TEXT"),
            ("npcs", "merchant_id", "INTEGER REFERENCES merchants(id) ON DELETE SET NULL"),
        )
        for table, column, decl in additions:
            cols = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
            if column not in cols:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")
        Database._ensure_starter_learnable_moves(conn)

    @staticmethod
    def _ensure_starter_learnable_moves(conn: sqlite3.Connection) -> None:
        """
        Existing production databases may have starter species without any
        learnable move rows, which prevents binding a starter to a player.
        """
        starter_rows = conn.execute(
            "SELECT id FROM pokemon_species WHERE is_starter = 1 ORDER BY id"
        ).fetchall()
        if not starter_rows:
            return

        move_row = conn.execute(
            "SELECT id FROM moves WHERE name = ?",
            ("Tackle",),
        ).fetchone()
        if move_row is None:
            cursor = conn.execute(
                """
                INSERT INTO moves (name, type, category, power, accuracy, pp)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                ("Tackle", "normal", "physical", 15, 100, 20),
            )
            move_id = cursor.lastrowid
        else:
            move_id = move_row["id"]

        conn.executemany(
            """
            INSERT INTO species_learnable_moves (species_id, move_id, learn_level)
            VALUES (?, ?, ?)
            ON CONFLICT(species_id, move_id) DO NOTHING
            """,
            [(row["id"], move_id, 1) for row in starter_rows],
        )

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        yield self._get_connection()

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        conn = self._get_connection()
        conn.execute("BEGIN IMMEDIATE")
        try:
            yield conn
        except Exception:
            conn.execute("ROLLBACK")
            raise
        else:
            conn.execute("COMMIT")

    def close(self) -> None:
        conn = getattr(self._local, "conn", None)
        if conn is not None:
            conn.close()
            self._local.conn = None
