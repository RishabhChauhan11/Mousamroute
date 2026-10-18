"""
Unit tests for Checkpoint Sampler.
"""
from datetime import datetime, timezone
import pytest
from routing.services.checkpoint_sampler import (
    haversine_distance_miles,
    sample_checkpoints,
)


class TestCheckpointSampler:
    def test_haversine_distance(self):
        # Distance between Chicago (41.8781, -87.6298) and Denver (39.7392, -104.9903) is ~920 miles
        dist = haversine_distance_miles(41.8781, -87.6298, 39.7392, -104.9903)
        assert 900.0 < dist < 940.0

    def test_sampling_intervals(self):
        # A simple straight line from (0,0) to (0, 1.0) approx 69 miles
        coords = [[0.0, 0.0], [0.0, 1.0]]
        dep_time = datetime(2026, 10, 15, 8, 0, 0, tzinfo=timezone.utc)
        duration_sec = 3600 * 2  # 2 hours

        cps_25 = sample_checkpoints(
            geometry=coords,
            departure_dt=dep_time,
            total_duration_seconds=duration_sec,
            interval_miles=25.0,
        )
        assert len(cps_25) >= 3  # Start (0), 25, 50, end (~69)
        assert cps_25[0]["distance_from_origin_miles"] == 0.0
        assert cps_25[0]["eta_iso"].endswith("08:00:00Z")

        # Verify ETA progression
        assert cps_25[-1]["elapsed_hours"] > 0
        assert cps_25[-1]["distance_from_origin_miles"] > 60.0
