"""
Checkpoint Sampling Service.

Samples route geometries at regular intervals (10, 25, or 50 miles).
Interpolates geographic coordinates along the polyline and computes
the truck's Estimated Time of Arrival (ETA) at each checkpoint.
"""
import math
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple


def haversine_distance_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points in miles using the Haversine formula.
    """
    R = 3958.8  # Earth's radius in miles

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def sample_checkpoints(
    geometry: List[List[float]],  # [[lng, lat], ...]
    departure_dt: datetime,
    total_duration_seconds: float,
    interval_miles: float = 25.0,
) -> List[Dict[str, Any]]:
    """
    Samples checkpoints along the route polyline at every `interval_miles`.
    Returns checkpoints with coordinates, cumulative mileage, segment mileage, and ETA.
    """
    if not geometry or len(geometry) < 2:
        return []

    # 1. Compute cumulative distance along geometry
    # Geometry is [[lng, lat], ...]
    segment_lengths: List[float] = []
    cumulative_distances: List[float] = [0.0]

    for i in range(len(geometry) - 1):
        lng1, lat1 = geometry[i]
        lng2, lat2 = geometry[i + 1]
        dist = haversine_distance_miles(lat1, lon1=lng1, lat2=lat2, lon2=lng2)
        segment_lengths.append(dist)
        cumulative_distances.append(cumulative_distances[-1] + dist)

    total_route_miles = cumulative_distances[-1]
    if total_route_miles <= 0:
        total_route_miles = 0.001

    # 2. Determine target distances for checkpoints
    # Always include 0 (origin) and total_route_miles (destination)
    target_distances = [0.0]
    curr = interval_miles
    while curr < total_route_miles - (interval_miles * 0.25):  # avoid tiny redundant last slice
        target_distances.append(curr)
        curr += interval_miles

    if target_distances[-1] != total_route_miles:
        target_distances.append(total_route_miles)

    # 3. Interpolate coordinates for each target distance
    checkpoints: List[Dict[str, Any]] = []
    poly_idx = 0

    for idx, target_dist in enumerate(target_distances):
        # Advance polyline index until target_dist falls within segment
        while (
            poly_idx < len(segment_lengths)
            and cumulative_distances[poly_idx + 1] < target_dist
        ):
            poly_idx += 1

        if poly_idx >= len(segment_lengths):
            # Clamp to final point
            lat = geometry[-1][1]
            lng = geometry[-1][0]
        else:
            seg_start_dist = cumulative_distances[poly_idx]
            seg_len = segment_lengths[poly_idx]
            lng1, lat1 = geometry[poly_idx]
            lng2, lat2 = geometry[poly_idx + 1]

            if seg_len > 0:
                fraction = (target_dist - seg_start_dist) / seg_len
                lat = lat1 + fraction * (lat2 - lat1)
                lng = lng1 + fraction * (lng2 - lng1)
            else:
                lat, lng = lat1, lng1

        # Compute truck ETA at this checkpoint
        time_fraction = target_dist / total_route_miles
        elapsed_seconds = time_fraction * total_duration_seconds
        eta_dt = departure_dt + timedelta(seconds=elapsed_seconds)

        # Segment length represented by this checkpoint (for mileage aggregation)
        if len(target_distances) == 1:
            seg_miles = total_route_miles
        elif idx == 0:
            seg_miles = (target_distances[1] - target_distances[0]) / 2.0
        elif idx == len(target_distances) - 1:
            seg_miles = (target_distances[-1] - target_distances[-2]) / 2.0
        else:
            prev_mid = (target_distances[idx] - target_distances[idx - 1]) / 2.0
            next_mid = (target_distances[idx + 1] - target_distances[idx]) / 2.0
            seg_miles = prev_mid + next_mid

        checkpoints.append({
            "index": idx,
            "latitude": round(lat, 5),
            "longitude": round(lng, 5),
            "distance_from_origin_miles": round(target_dist, 1),
            "segment_miles": round(seg_miles, 1),
            "eta_iso": eta_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "eta_formatted": eta_dt.strftime("%b %d, %I:%M %p"),
            "elapsed_hours": round(elapsed_seconds / 3600.0, 2),
        })

    return checkpoints
