"""
Integration tests for Django API endpoints.
"""
import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestRoutingAPI:
    def setup_method(self):
        self.client = APIClient()

    def test_health_check(self):
        response = self.client.get("/api/health/")
        assert response.status_code == 200
        assert response.data["status"] == "healthy"

    def test_geocoding_search(self):
        response = self.client.get("/api/geocoding/search/?q=chicago")
        assert response.status_code == 200
        assert len(response.data) > 0
        assert "Chicago" in response.data[0]["name"]

    def test_routes_analyze_validation_error(self):
        # Missing load_weight_lb and destination
        response = self.client.post("/api/routes/analyze/", {"origin": "Chicago, IL"}, format="json")
        assert response.status_code == 400
        assert "destination" in response.data["details"]
        assert "load_weight_lb" in response.data["details"]

    def test_routes_analyze_success(self):
        payload = {
            "origin": "Chicago, IL",
            "destination": "St. Louis, MO",
            "load_weight_lb": 35000,
            "sampling_interval_miles": 50,
            "departure_time": "2026-10-15T08:00:00Z",
        }
        response = self.client.post("/api/routes/analyze/", payload, format="json")
        assert response.status_code == 200
        data = response.data

        assert "routes" in data
        assert len(data["routes"]) == 3
        # Exactly one recommended route
        recommended_routes = [r for r in data["routes"] if r["is_recommended"]]
        assert len(recommended_routes) == 1

        top_route = recommended_routes[0]
        assert top_route["rank"] == 1
        assert "metrics" in top_route
        assert "checkpoints" in top_route
        assert len(top_route["checkpoints"]) > 0

        # Checkpoint structure
        cp0 = top_route["checkpoints"][0]
        assert "risk" in cp0
        assert "weather" in cp0
        assert "timeline_48h" in cp0
        assert len(cp0["timeline_48h"]) > 0
