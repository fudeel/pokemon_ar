# app/api/schemas/starter.py

from __future__ import annotations

from pydantic import BaseModel


class StarterChoiceRequest(BaseModel):
    species_id: int
