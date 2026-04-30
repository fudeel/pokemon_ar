# app/api/schemas/common.py

from __future__ import annotations

from pydantic import BaseModel, Field


class GeoLocationModel(BaseModel):
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
