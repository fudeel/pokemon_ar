# app/repositories/base_repository.py

from __future__ import annotations

from datetime import datetime, timezone

from app.core.database import Database


class BaseRepository:
    """Shared utilities for all SQLite-backed repositories."""

    _SQLITE_TIMESTAMP_FORMATS: tuple[str, ...] = (
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S.%f",
    )

    def __init__(self, database: Database) -> None:
        self._database = database

    @property
    def db(self) -> Database:
        return self._database

    @classmethod
    def parse_timestamp(cls, value: str | None) -> datetime | None:
        if value is None:
            return None
        for fmt in cls._SQLITE_TIMESTAMP_FORMATS:
            try:
                parsed = datetime.strptime(value, fmt)
                return parsed.replace(tzinfo=timezone.utc)
            except ValueError:
                continue
        return datetime.fromisoformat(value)

    @staticmethod
    def format_timestamp(value: datetime) -> str:
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        return value.strftime("%Y-%m-%d %H:%M:%S")
