# app/domain/world/polygon.py

from __future__ import annotations

import json
import math
from typing import Iterable

from app.domain.world.geo_location import GeoLocation


def _approx_circle_polygon(center: GeoLocation, radius_meters: float, vertices: int = 24) -> tuple[GeoLocation, ...]:
    """Build a regular-polygon approximation of a circle. Used to backfill legacy rows."""
    lat_rad = math.radians(center.latitude)
    earth = GeoLocation._EARTH_RADIUS_METERS
    lat_delta_per_m = math.degrees(1.0 / earth)
    lng_delta_per_m = math.degrees(1.0 / (earth * max(math.cos(lat_rad), 1e-9)))
    points: list[GeoLocation] = []
    for i in range(vertices):
        theta = 2.0 * math.pi * (i / vertices)
        dx = radius_meters * math.cos(theta)
        dy = radius_meters * math.sin(theta)
        points.append(
            GeoLocation(
                latitude=center.latitude + dy * lat_delta_per_m,
                longitude=center.longitude + dx * lng_delta_per_m,
            )
        )
    return tuple(points)


def serialize_polygon(polygon: Iterable[GeoLocation]) -> str:
    return json.dumps([{"lat": p.latitude, "lng": p.longitude} for p in polygon])


def deserialize_polygon(payload: str | None) -> tuple[GeoLocation, ...] | None:
    if payload is None:
        return None
    raw = json.loads(payload)
    if not raw:
        return None
    return tuple(GeoLocation(latitude=float(p["lat"]), longitude=float(p["lng"])) for p in raw)


def hydrate_polygon(
    *,
    payload: str | None,
    fallback_center: GeoLocation,
    fallback_radius_meters: float,
) -> tuple[GeoLocation, ...]:
    """Decode the stored polygon, falling back to a circle approximation for legacy rows."""
    polygon = deserialize_polygon(payload)
    if polygon is not None and len(polygon) >= 3:
        return polygon
    return _approx_circle_polygon(fallback_center, fallback_radius_meters)


def validate_polygon(polygon: tuple[GeoLocation, ...]) -> None:
    if len(polygon) < 3:
        raise ValueError("polygon requires at least 3 vertices")


def centroid(polygon: tuple[GeoLocation, ...]) -> GeoLocation:
    """Area-weighted centroid in lat/lng space (good enough for small zones)."""
    n = len(polygon)
    if n == 0:
        raise ValueError("empty polygon")
    if n < 3:
        lat = sum(p.latitude for p in polygon) / n
        lng = sum(p.longitude for p in polygon) / n
        return GeoLocation(latitude=lat, longitude=lng)

    area2 = 0.0
    cx = 0.0
    cy = 0.0
    for i in range(n):
        x1, y1 = polygon[i].longitude, polygon[i].latitude
        x2, y2 = polygon[(i + 1) % n].longitude, polygon[(i + 1) % n].latitude
        cross = x1 * y2 - x2 * y1
        area2 += cross
        cx += (x1 + x2) * cross
        cy += (y1 + y2) * cross

    if abs(area2) < 1e-15:
        # Degenerate (collinear); fall back to vertex average.
        lat = sum(p.latitude for p in polygon) / n
        lng = sum(p.longitude for p in polygon) / n
        return GeoLocation(latitude=lat, longitude=lng)

    cx /= 3.0 * area2
    cy /= 3.0 * area2
    return GeoLocation(latitude=cy, longitude=cx)


def bounding_radius_meters(polygon: tuple[GeoLocation, ...], center: GeoLocation) -> float:
    """Distance from the centroid to the farthest vertex — used as the bounding-circle radius."""
    if not polygon:
        return 0.0
    return max(center.distance_meters_to(p) for p in polygon)


def bounding_box(polygon: tuple[GeoLocation, ...]) -> tuple[float, float, float, float]:
    """(min_lat, max_lat, min_lng, max_lng)"""
    lats = [p.latitude for p in polygon]
    lngs = [p.longitude for p in polygon]
    return min(lats), max(lats), min(lngs), max(lngs)
