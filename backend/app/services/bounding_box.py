# app/services/bounding_box.py

from __future__ import annotations

import math
from dataclasses import dataclass

from app.domain.world.geo_location import GeoLocation


@dataclass(frozen=True, slots=True)
class BoundingBox:
    min_lat: float
    max_lat: float
    min_lng: float
    max_lng: float

    @classmethod
    def around(cls, center: GeoLocation, radius_meters: float) -> "BoundingBox":
        lat_delta = math.degrees(radius_meters / GeoLocation._EARTH_RADIUS_METERS)
        lng_delta = math.degrees(radius_meters / (GeoLocation._EARTH_RADIUS_METERS * math.cos(math.radians(center.latitude))))
        return cls(
            min_lat=max(-90.0, center.latitude - lat_delta),
            max_lat=min(90.0, center.latitude + lat_delta),
            min_lng=max(-180.0, center.longitude - lng_delta),
            max_lng=min(180.0, center.longitude + lng_delta),
        )
