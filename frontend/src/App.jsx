import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RouteForm from './components/RouteForm';
import RouteCard from './components/RouteCard';
import MapView from './components/MapView';
import ForecastSlider from './components/ForecastSlider';
import RiskLegend from './components/RiskLegend';
import { analyzeRoutes } from './services/api';
import { AlertCircle, Navigation, Loader2 } from 'lucide-react';

export default function App() {
  const [routeData, setRouteData] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 0-48 hour forecast slider state
  const [hourOffset, setHourOffset] = useState(0);
  const [heatmapMode, setHeatmapMode] = useState('risk');

  // Form initial state (can be populated by presets)
  const [formValues, setFormValues] = useState({
    origin: 'Chicago, IL',
    destination: 'Denver, CO',
    weight: 35000,
    interval: 25,
    departureTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  });

  // Handle route calculation
  const handleAnalyze = async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeRoutes(params);
      setRouteData(data);
      // Automatically select the recommended route
      const rec = data.routes.find((r) => r.is_recommended) || data.routes[0];
      setSelectedRouteId(rec ? rec.id : null);
      setHourOffset(0);
    } catch (err) {
      console.error('Error analyzing routes:', err);
      setError(err.message || 'Failed to calculate routes and weather risk.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load: trigger analysis so user is immediately greeted with an active map!
  useEffect(() => {
    handleAnalyze({
      origin: formValues.origin,
      destination: formValues.destination,
      departureTime: new Date(formValues.departureTime).toISOString(),
      loadWeightLb: formValues.weight,
      samplingIntervalMiles: formValues.interval,
    });
  }, []);

  // When user clicks a preset scenario from header
  const handleSelectPreset = (preset) => {
    setFormValues((prev) => ({
      ...prev,
      origin: preset.origin,
      destination: preset.destination,
      weight: preset.weight,
      interval: preset.interval,
    }));
    handleAnalyze({
      origin: preset.origin,
      destination: preset.destination,
      departureTime: new Date(formValues.departureTime).toISOString(),
      loadWeightLb: preset.weight,
      samplingIntervalMiles: preset.interval,
    });
  };

  const routes = routeData?.routes || [];

  return (
    <div className="app-container">
      <Header onSelectPreset={handleSelectPreset} />

      <main className="main-layout">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <RouteForm
            onSubmit={handleAnalyze}
            loading={loading}
            initialValues={formValues}
          />

          {error && (
            <div
              style={{
                margin: '16px 20px',
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Analysis Error:</strong> {error}
              </div>
            </div>
          )}

          {loading && !routeData && (
            <div className="loading-overlay">
              <div className="spinner" />
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Fetching 3 OSRM corridors and batching hourly weather forecasts...
              </p>
            </div>
          )}

          {routeData && (
            <div>
              <div className="results-header">
                <div>
                  <h2 className="results-title">Evaluated Route Options</h2>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Ranked by lowest Severe miles &gt; High miles &gt; Average risk
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                  }}
                >
                  {routes.length} Alternatives
                </span>
              </div>

              <div className="route-cards-list">
                {routes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isSelected={route.id === selectedRouteId}
                    onSelect={(id) => setSelectedRouteId(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Map View */}
        <section className="map-container">
          <MapView
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
            origin={routeData?.origin}
            destination={routeData?.destination}
            corridorBounds={routeData?.corridor_bounds}
            hourOffset={hourOffset}
            heatmapMode={heatmapMode}
          />

          {/* Floating Risk Legend on top right */}
          <RiskLegend />

          {/* Floating 0-48h Forecast Slider at the bottom */}
          {routes.length > 0 && (
            <ForecastSlider
              hourOffset={hourOffset}
              onChangeHour={setHourOffset}
              heatmapMode={heatmapMode}
              onChangeHeatmapMode={setHeatmapMode}
              departureTime={routeData?.departure_time}
            />
          )}
        </section>
      </main>
    </div>
  );
}
