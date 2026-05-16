# app/config.py

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class AppConfig:
    database_path: Path
    schema_path: Path
    token_lifetime_seconds: int
    admin_token_lifetime_seconds: int
    capture_proximity_meters: float
    interaction_proximity_meters: float
    world_snapshot_radius_meters: float

    @classmethod
    def from_env(cls) -> "AppConfig":
        root = Path(__file__).resolve().parent.parent
        return cls(
            database_path=Path(os.environ.get("POKEMON_DB_PATH", root / "pokemon.db")),
            schema_path=root / "app" / "db" / "schema.sql",
            token_lifetime_seconds=int(os.environ.get("POKEMON_TOKEN_TTL", 60 * 60 * 24 * 7)),
            admin_token_lifetime_seconds=int(os.environ.get("POKEMON_ADMIN_TOKEN_TTL", 60 * 60 * 12)),
            capture_proximity_meters=float(os.environ.get("POKEMON_CAPTURE_RADIUS_M", 60.0)),
            interaction_proximity_meters=float(os.environ.get("POKEMON_INTERACTION_RADIUS_M", 50.0)),
            world_snapshot_radius_meters=float(os.environ.get("POKEMON_WORLD_RADIUS_M", 5000.0)),
        )


CONFIG = AppConfig.from_env()
