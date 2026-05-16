# app/domain/world/geo_location.py

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import ClassVar


@dataclass(frozen=True, slots=True)
class GeoLocation:
    latitude: float
    longitude: float

    _EARTH_RADIUS_METERS: ClassVar[float] = 6_371_000.0

    def __post_init__(self) -> None:
        if not -90.0 <= self.latitude <= 90.0:
            raise ValueError(f"latitude {self.latitude} out of range")
        if not -180.0 <= self.longitude <= 180.0:
            raise ValueError(f"longitude {self.longitude} out of range")

    def distance_meters_to(self, other: "GeoLocation") -> float:
        lat1 = math.radians(self.latitude)
        lat2 = math.radians(other.latitude)
        d_lat = math.radians(other.latitude - self.latitude)
        d_lng = math.radians(other.longitude - self.longitude)
        a = math.sin(d_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(d_lng / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        return self._EARTH_RADIUS_METERS * c

    def is_within_meters(self, other: "GeoLocation", radius_meters: float) -> bool:
        return self.distance_meters_to(other) <= radius_meters
