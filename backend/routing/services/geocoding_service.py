"""
Geocoding Service.

Resolves address, city/state, or coordinate strings to (latitude, longitude, display_name).
Uses Open-Meteo free geocoding API with robust offline fallbacks for popular transport hubs.
"""
import logging
import re
from typing import Dict, Any, Optional
import requests

logger = logging.getLogger(__name__)

# Common transportation hub coordinates for instant fallback
KNOWN_HUBS: Dict[str, Dict[str, Any]] = {
    "chicago": {"lat": 41.8781, "lng": -87.6298, "name": "Chicago, IL, USA"},
    "denver": {"lat": 39.7392, "lng": -104.9903, "name": "Denver, CO, USA"},
    "new york": {"lat": 40.7128, "lng": -74.0060, "name": "New York, NY, USA"},
    "los angeles": {"lat": 34.0522, "lng": -118.2437, "name": "Los Angeles, CA, USA"},
    "dallas": {"lat": 32.7767, "lng": -96.7970, "name": "Dallas, TX, USA"},
    "atlanta": {"lat": 33.7490, "lng": -84.3880, "name": "Atlanta, GA, USA"},
    "seattle": {"lat": 47.6062, "lng": -122.3321, "name": "Seattle, WA, USA"},
    "miami": {"lat": 25.7617, "lng": -80.1918, "name": "Miami, FL, USA"},
    "kansas city": {"lat": 39.0997, "lng": -94.5786, "name": "Kansas City, MO, USA"},
    "st louis": {"lat": 38.6270, "lng": -90.1994, "name": "St. Louis, MO, USA"},
    "minneapolis": {"lat": 44.9778, "lng": -93.2650, "name": "Minneapolis, MN, USA"},
    "houston": {"lat": 29.7604, "lng": -95.3698, "name": "Houston, TX, USA"},
    "salt lake city": {"lat": 40.7608, "lng": -111.8910, "name": "Salt Lake City, UT, USA"},
    "phoenix": {"lat": 33.4484, "lng": -112.0740, "name": "Phoenix, AZ, USA"},
    "columbus": {"lat": 39.9612, "lng": -82.9988, "name": "Columbus, OH, USA"},
    "omaha": {"lat": 41.2565, "lng": -95.9345, "name": "Omaha, NE, USA"},
}


def geocode_location(query: str) -> Dict[str, Any]:
    """
    Resolve a query string to latitude and longitude.
    Accepts:
      - Coordinate format: "41.8781, -87.6298"
      - City name: "Chicago, IL", "Denver", "Dallas, TX"
    """
    query = query.strip()
    if not query:
        raise ValueError("Location query cannot be empty.")

    # 1. Check if raw coordinates
    coord_match = re.match(r"^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$", query)
    if coord_match:
        parts = [p.strip() for p in query.split(",")]
        lat, lng = float(parts[0]), float(parts[1])
        return {
            "lat": lat,
            "lng": lng,
            "name": f"Coordinate ({lat:.4f}, {lng:.4f})",
        }

    # 2. Check known hubs (fast match)
    query_lower = query.lower()
    for key, data in KNOWN_HUBS.items():
        if key in query_lower:
            return {
                "lat": data["lat"],
                "lng": data["lng"],
                "name": data["name"],
            }

    # 3. Call Open-Meteo Geocoding API
    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {"name": query, "count": 1, "language": "en", "format": "json"}
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if "results" in data and len(data["results"]) > 0:
                top = data["results"][0]
                name_parts = [top.get("name", "")]
                if top.get("admin1"):
                    name_parts.append(top["admin1"])
                if top.get("country_code"):
                    name_parts.append(top["country_code"])
                return {
                    "lat": float(top["latitude"]),
                    "lng": float(top["longitude"]),
                    "name": ", ".join(name_parts),
                }
    except Exception as e:
        logger.warning(f"External geocoding failed for '{query}': {e}")

    # Fallback to Chicago if nothing matched
    logger.warning(f"Could not resolve location '{query}', using fallback.")
    return {
        "lat": 41.8781,
        "lng": -87.6298,
        "name": query,
    }
