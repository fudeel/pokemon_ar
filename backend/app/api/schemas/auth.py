# app/api/schemas/auth.py

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class PlayerRegistrationRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class PlayerLoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    token: str
    expires_at: datetime


class PlayerLoginResponse(BaseModel):
    token: str
    expires_at: datetime
    player_id: int
    username: str
    has_chosen_starter: bool


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminRegistrationRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8, max_length=128)
