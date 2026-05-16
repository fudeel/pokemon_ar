# app/api/routers/world_router.py

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import container_dep, current_player
from app.api.presenters import snapshot_to_response
from app.api.schemas.world import WorldSnapshotRequest, WorldSnapshotResponse
from app.container import Container
from app.domain.characters.player import Player
from app.domain.world.geo_location import GeoLocation

router = APIRouter(prefix="/world", tags=["world"])


@router.post("/snapshot", response_model=WorldSnapshotResponse)
def get_world_snapshot(
    payload: WorldSnapshotRequest,
    player: Player = Depends(current_player),
    container: Container = Depends(container_dep),
) -> WorldSnapshotResponse:
    location = GeoLocation(latitude=payload.location.latitude, longitude=payload.location.longitude)
    snapshot = container.world_service.build_snapshot(
        player_id=player.id, center=location, radius_meters=payload.radius_meters
    )
    return snapshot_to_response(snapshot)
