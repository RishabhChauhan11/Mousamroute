import React from 'react';
import { Circle } from 'react-leaflet';
import { getRiskColor } from '../utils/riskColors';

export default function WeatherHeatmapLayer({ routes, hourOffset, heatmapMode }) {
  if (!routes || routes.length === 0) return null;

  // Collect checkpoints across all routes to form the corridor
  const corridorPoints = [];
  routes.forEach((route) => {
    (route.checkpoints || []).forEach((cp) => {
      // Find the forecast matching hourOffset
      const timeline = cp.timeline_48h || [];
      const forecastAtHour = timeline.find((t) => t.hour_offset === hourOffset) || timeline[0] || {};

      let color = '#38bdf8';
      let opacity = 0.3;
      let radiusMeters = 38000; // ~24 miles corridor radius

      if (heatmapMode === 'risk') {
        const riskLevel = forecastAtHour.overall_risk || cp.risk?.overall_risk || 'Low';
        color = getRiskColor(riskLevel);
        const score = forecastAtHour.risk_score || cp.risk?.risk_score || 1;
        opacity = 0.15 + (score / 5) * 0.45;
        radiusMeters = 30000 + score * 8000;
      } else if (heatmapMode === 'wind') {
        const wind = forecastAtHour.wind_mph ?? cp.weather?.wind_mph ?? 10;
        if (wind >= 55) {
          color = '#881337';
          opacity = 0.6;
        } else if (wind >= 45) {
          color = '#ef4444';
          opacity = 0.55;
        } else if (wind >= 35) {
          color = '#f97316';
          opacity = 0.45;
        } else if (wind >= 25) {
          color = '#f59e0b';
          opacity = 0.35;
        } else {
          color = '#10b981';
          opacity = 0.2;
        }
        radiusMeters = 25000 + (wind / 60) * 25000;
      } else if (heatmapMode === 'precip') {
        const rain = forecastAtHour.rain_in_hr ?? cp.weather?.rain_in_hr ?? 0;
        const snow = forecastAtHour.snow_in_hr ?? cp.weather?.snow_in_hr ?? 0;
        const total = rain + snow;
        if (total > 1.0) {
          color = '#991b1b';
          opacity = 0.65;
        } else if (total > 0.5) {
          color = '#ef4444';
          opacity = 0.5;
        } else if (total > 0.25) {
          color = '#3b82f6';
          opacity = 0.45;
        } else if (total > 0.05) {
          color = '#38bdf8';
          opacity = 0.3;
        } else {
          color = '#0284c7';
          opacity = 0.15;
        }
        radiusMeters = 28000 + total * 20000;
      }

      corridorPoints.push({
        id: `${route.id}_${cp.index}`,
        lat: cp.latitude,
        lng: cp.longitude,
        color,
        opacity,
        radius: radiusMeters,
      });
    });
  });

  return (
    <>
      {corridorPoints.map((pt) => (
        <Circle
          key={pt.id}
          center={[pt.lat, pt.lng]}
          radius={pt.radius}
          pathOptions={{
            color: pt.color,
            fillColor: pt.color,
            fillOpacity: pt.opacity,
            weight: 0,
          }}
        />
      ))}
    </>
  );
}
