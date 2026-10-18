from routing.services.osrm_service import fetch_3_routes
from routing.services.checkpoint_sampler import sample_checkpoints
from datetime import datetime, timezone

# Let's test Seattle to Washington DC / New York / etc.
destinations = [
    ('Washington DC', (38.9072, -77.0369)),
    ('New York', (40.7128, -74.0060)),
    ('Miami', (25.7617, -80.1918)),
]

for name, (d_lat, d_lng) in destinations:
    print(f"=== DESTINATION: {name} ===")
    routes = fetch_3_routes(47.6062, -122.3321, d_lat, d_lng)
    for r in routes:
        cps = sample_checkpoints(r['geometry'], datetime.now(timezone.utc), r['duration_seconds'], 25.0)
        lats = [c['latitude'] for c in cps]
        lngs = [c['longitude'] for c in cps]
        print(f"  {r['id']} ({r['name']}): count={len(cps)}, lat=[{min(lats):.2f}, {max(lats):.2f}], lng=[{min(lngs):.2f}, {max(lngs):.2f}]")
