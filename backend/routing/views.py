"""
API Views for Weather-Aware Truck Routing.
"""
import logging
from datetime import datetime, timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from routing.serializers import RouteAnalysisRequestSerializer
from routing.services.geocoding_service import geocode_location, KNOWN_HUBS
from routing.services.osrm_service import fetch_3_routes
from routing.services.checkpoint_sampler import sample_checkpoints
from routing.services.weather_service import enrich_checkpoints_with_weather
from routing.services.route_recommender import rank_and_recommend_routes

logger = logging.getLogger(__name__)


class RouteAnalyzeView(APIView):
    """
    POST /api/routes/analyze/
    Analyzes 3 alternative routes between origin and destination,
    samples weather checkpoints along each path according to truck ETA,
    applies load weight rules, and recommends the safest route.
    """

    def post(self, request, *args, **kwargs):
        serializer = RouteAnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid request parameters", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated = serializer.validated_data
        origin_query = validated["origin"]
        dest_query = validated["destination"]
        departure_dt = validated.get("departure_time") or datetime.now(timezone.utc)
        load_weight_lb = validated["load_weight_lb"]
        sampling_interval_miles = float(validated.get("sampling_interval_miles", 25))

        try:
            print(f"=== ANALYZING ROUTE: origin='{origin_query}', destination='{dest_query}', load={load_weight_lb} lb ===")
            # 1. Geocode origin and destination
            origin_geo = geocode_location(origin_query)
            dest_geo = geocode_location(dest_query)
            print(f"=== GEOCODED: origin={origin_geo}, dest={dest_geo} ===")

            # 2. Fetch 3 route options
            raw_routes = fetch_3_routes(
                start_lat=origin_geo["lat"],
                start_lng=origin_geo["lng"],
                end_lat=dest_geo["lat"],
                end_lng=dest_geo["lng"],
            )

            # 3. For each route, sample checkpoints and enrich with weather & risk
            processed_routes = []
            for r in raw_routes:
                cps = sample_checkpoints(
                    geometry=r["geometry"],
                    departure_dt=departure_dt,
                    total_duration_seconds=r["duration_seconds"],
                    interval_miles=sampling_interval_miles,
                )

                enriched_cps = enrich_checkpoints_with_weather(
                    checkpoints=cps,
                    load_weight_lb=load_weight_lb,
                )

                processed_routes.append({
                    **r,
                    "checkpoints": enriched_cps,
                })

            # 4. Rank and recommend safest route
            ranked_routes = rank_and_recommend_routes(processed_routes)

            # 5. Compute corridor bounds for camera fitting
            all_lats = [origin_geo["lat"], dest_geo["lat"]]
            all_lngs = [origin_geo["lng"], dest_geo["lng"]]
            for r in ranked_routes:
                for cp in r.get("checkpoints", []):
                    all_lats.append(cp["latitude"])
                    all_lngs.append(cp["longitude"])

            corridor_bounds = {
                "min_lat": min(all_lats),
                "max_lat": max(all_lats),
                "min_lng": min(all_lngs),
                "max_lng": max(all_lngs),
            }

            return Response(
                {
                    "origin": origin_geo,
                    "destination": dest_geo,
                    "departure_time": departure_dt.isoformat(),
                    "load_weight_lb": load_weight_lb,
                    "sampling_interval_miles": sampling_interval_miles,
                    "corridor_bounds": corridor_bounds,
                    "routes": ranked_routes,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.exception("Error analyzing routes")
            return Response(
                {"error": "Failed to analyze routes", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GeocodeSearchView(APIView):
    """
    GET /api/geocoding/search/?q=...
    Instant search / suggestions for popular freight cities.
    """

    def get(self, request, *args, **kwargs):
        q = request.query_params.get("q", "").strip().lower()
        if not q:
            # Return top default hubs
            top = [
                {"name": data["name"], "lat": data["lat"], "lng": data["lng"]}
                for data in list(KNOWN_HUBS.values())[:8]
            ]
            return Response(top)

        matches = []
        for key, data in KNOWN_HUBS.items():
            if q in key or q in data["name"].lower():
                matches.append({"name": data["name"], "lat": data["lat"], "lng": data["lng"]})

        return Response(matches[:6])


class HealthCheckView(APIView):
    """
    GET /api/health/
    """

    def get(self, request, *args, **kwargs):
        return Response({"status": "healthy", "service": "weather-aware-truck-routing"})
