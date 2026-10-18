import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getRiskColor, RISK_CONFIG } from '../utils/riskColors';
import WeatherHeatmapLayer from './WeatherHeatmapLayer';
import { Wind, CloudRain, Snowflake, Thermometer, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

// Component to automatically fit bounds whenever routes or endpoints change
function MapBoundsUpdater({ bounds, origin, destination }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.min_lat && bounds.max_lat) {
      const corner1 = L.latLng(bounds.min_lat, bounds.min_lng);
      const corner2 = L.latLng(bounds.max_lat, bounds.max_lng);
      const leafletBounds = L.latLngBounds(corner1, corner2);
      map.fitBounds(leafletBounds, { padding: [60, 60], maxZoom: 13 });
    } else if (origin && destination) {
      const corner1 = L.latLng(origin.lat, origin.lng);
      const corner2 = L.latLng(destination.lat, destination.lng);
      map.fitBounds(L.latLngBounds(corner1, corner2), { padding: [80, 80] });
    }
  }, [bounds, origin, destination, map]);

  return null;
}

// Custom DivIcons for checkpoints
function createCheckpointIcon(riskLevel, isHighRisk) {
  const color = getRiskColor(riskLevel);
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        ${
          isHighRisk
            ? `<div class="pin-pulse" style="background-color: ${color}; opacity: 0.7;"></div>`
            : ''
        }
        <div class="pin-core" style="background-color: ${color};"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

// Custom DivIcons for Origin and Destination
function createEndpointIcon(type, name) {
  const isOrigin = type === 'origin';
  const color = isOrigin ? '#38bdf8' : '#10b981';
  const label = isOrigin ? 'A' : 'B';

  return L.divIcon({
    className: 'endpoint-pin',
    html: `
      <div style="
        background: ${color};
        color: #041226;
        font-weight: 800;
        font-size: 11px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #ffffff;
        box-shadow: 0 0 12px ${color};
      ">
        ${label}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

export default function MapView({
  routes,
  selectedRouteId,
  onSelectRoute,
  origin,
  destination,
  corridorBounds,
  hourOffset,
  heatmapMode,
}) {
  // Default center: United States center (approx Kansas)
  const defaultCenter = [39.8283, -98.5795];
  const defaultZoom = 4;

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        {/* Esri World Dark Gray Canvas Tile Layer */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin | Weather: Open-Meteo | Routing: OSRM'
          maxZoom={16}
        />

        {/* Auto fit bounds */}
        <MapBoundsUpdater bounds={corridorBounds} origin={origin} destination={destination} />

        {/* Corridor Heatmap Layer with 0-48h slider offset */}
        <WeatherHeatmapLayer routes={routes} hourOffset={hourOffset} heatmapMode={heatmapMode} />

        {/* Render 3 Route Polylines */}
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isRec = route.is_recommended;
          const polyCoords = (route.geometry || []).map((pt) => [pt[1], pt[0]]);

          // Vibrant styling for selected route
          const strokeColor = isSelected
            ? isRec
              ? '#10b981'
              : '#38bdf8'
            : 'rgba(148, 163, 184, 0.45)';
          const strokeWeight = isSelected ? 6 : 3;
          const strokeOpacity = isSelected ? 0.95 : 0.45;
          const dashArray = isSelected ? null : '6, 6';

          return (
            <Polyline
              key={route.id}
              positions={polyCoords}
              pathOptions={{
                color: strokeColor,
                weight: strokeWeight,
                opacity: strokeOpacity,
                dashArray: dashArray,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{
                click: () => onSelectRoute(route.id),
              }}
            />
          );
        })}

        {/* Render Checkpoints for Selected Route */}
        {selectedRoute &&
          (selectedRoute.checkpoints || []).map((cp) => {
            const riskInfo = cp.risk || {};
            const weather = cp.weather || {};
            const rLevel = riskInfo.overall_risk || 'Low';
            const isHighRisk =
              rLevel === 'High' || rLevel === 'Severe' || rLevel === 'No Travel';

            return (
              <Marker
                key={`${selectedRoute.id}_cp_${cp.index}`}
                position={[cp.latitude, cp.longitude]}
                icon={createCheckpointIcon(rLevel, isHighRisk)}
              >
                <Popup>
                  <div className="checkpoint-popup-card">
                    <div className="popup-header">
                      <span className="popup-mile">Mile {cp.distance_from_origin_miles.toFixed(1)}</span>
                      <span className="popup-eta">ETA: {cp.eta_formatted}</span>
                    </div>

                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: RISK_CONFIG[rLevel]?.bg || 'rgba(255,255,255,0.1)',
                          color: RISK_CONFIG[rLevel]?.text || '#ffffff',
                          border: `1px solid ${RISK_CONFIG[rLevel]?.border || 'transparent'}`,
                        }}
                      >
                        {rLevel} Risk (Level {riskInfo.risk_score}/5)
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {weather.description}
                      </span>
                    </div>

                    <div className="popup-row">
                      <span className="popup-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Wind size={13} color="#38bdf8" /> Wind Speed:
                      </span>
                      <span className="popup-val">{weather.wind_mph} mph ({riskInfo.adjusted_wind_risk})</span>
                    </div>

                    <div className="popup-row">
                      <span className="popup-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CloudRain size={13} color="#60a5fa" /> Rain Rate:
                      </span>
                      <span className="popup-val">{weather.rain_in_hr} in/hr</span>
                    </div>

                    <div className="popup-row">
                      <span className="popup-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Snowflake size={13} color="#a5f3fc" /> Snowfall:
                      </span>
                      <span className="popup-val">{weather.snow_in_hr} in/hr</span>
                    </div>

                    <div className="popup-row">
                      <span className="popup-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Thermometer size={13} color="#f59e0b" /> Temperature:
                      </span>
                      <span className="popup-val">{weather.temperature_f}°F</span>
                    </div>

                    {riskInfo.load_rule_applied && (
                      <div className="load-alert-banner">
                        <AlertTriangle size={13} style={{ display: 'inline', marginRight: 4 }} />
                        <strong>Load Rule Penalty:</strong> {riskInfo.load_rule_applied}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Origin Marker */}
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={createEndpointIcon('origin', origin.name)}>
            <Popup>
              <div style={{ padding: 8 }}>
                <strong style={{ color: '#38bdf8' }}>Origin:</strong> {origin.name}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={createEndpointIcon('destination', destination.name)}>
            <Popup>
              <div style={{ padding: 8 }}>
                <strong style={{ color: '#10b981' }}>Destination:</strong> {destination.name}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
