"""
Unit tests for Route Recommendation Hierarchy.
"""
import pytest
from routing.services.risk_evaluator import RiskLevel
from routing.services.route_recommender import rank_and_recommend_routes


def make_mock_checkpoint(seg_miles: float, risk_level: str, risk_score: int):
    return {
        "index": 0,
        "segment_miles": seg_miles,
        "distance_from_origin_miles": seg_miles,
        "eta_formatted": "Oct 15, 10:00 AM",
        "risk": {
            "overall_risk": risk_level,
            "risk_score": risk_score,
            "load_rule_applied": None,
        },
    }


class TestRouteRecommender:
    def test_prefers_fewest_severe_miles(self):
        # Route 1: 20 miles severe, duration 5 hours
        # Route 2: 0 miles severe, duration 6 hours
        r1 = {
            "id": "r1",
            "name": "Route 1",
            "distance_miles": 100,
            "duration_seconds": 18000,
            "checkpoints": [
                make_mock_checkpoint(20, RiskLevel.SEVERE, 4),
                make_mock_checkpoint(80, RiskLevel.LOW, 1),
            ],
        }
        r2 = {
            "id": "r2",
            "name": "Route 2",
            "distance_miles": 110,
            "duration_seconds": 21600,
            "checkpoints": [
                make_mock_checkpoint(110, RiskLevel.LOW, 1),
            ],
        }

        ranked = rank_and_recommend_routes([r1, r2])
        assert ranked[0]["id"] == "r2"
        assert ranked[0]["is_recommended"] is True

    def test_prefers_fewest_high_miles_when_severe_tied(self):
        # Both 0 severe miles. Route 1 has 10 high miles; Route 2 has 40 high miles.
        r1 = {
            "id": "r1",
            "name": "Route 1",
            "distance_miles": 100,
            "duration_seconds": 20000,
            "checkpoints": [
                make_mock_checkpoint(10, RiskLevel.HIGH, 3),
                make_mock_checkpoint(90, RiskLevel.LOW, 1),
            ],
        }
        r2 = {
            "id": "r2",
            "name": "Route 2",
            "distance_miles": 100,
            "duration_seconds": 18000,
            "checkpoints": [
                make_mock_checkpoint(40, RiskLevel.HIGH, 3),
                make_mock_checkpoint(60, RiskLevel.LOW, 1),
            ],
        }

        ranked = rank_and_recommend_routes([r1, r2])
        assert ranked[0]["id"] == "r1"
        assert ranked[0]["is_recommended"] is True

    def test_prefers_shortest_time_when_risks_tied(self):
        # Same risk profile, but Route 2 is 30 mins faster
        r1 = {
            "id": "r1",
            "name": "Route 1",
            "distance_miles": 100,
            "duration_seconds": 7200,
            "checkpoints": [make_mock_checkpoint(100, RiskLevel.LOW, 1)],
        }
        r2 = {
            "id": "r2",
            "name": "Route 2",
            "distance_miles": 95,
            "duration_seconds": 5400,
            "checkpoints": [make_mock_checkpoint(95, RiskLevel.LOW, 1)],
        }

        ranked = rank_and_recommend_routes([r1, r2])
        assert ranked[0]["id"] == "r2"
        assert ranked[0]["is_recommended"] is True
