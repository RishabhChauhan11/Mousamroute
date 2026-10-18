import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Scale, Compass, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { searchLocations } from '../services/api';

export default function RouteForm({ onSubmit, loading, initialValues }) {
  const [origin, setOrigin] = useState(initialValues?.origin || 'Chicago, IL');
  const [destination, setDestination] = useState(initialValues?.destination || 'Denver, CO');
  const [departureTime, setDepartureTime] = useState(
    initialValues?.departureTime || new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  );
  const [loadWeight, setLoadWeight] = useState(initialValues?.weight || 35000);
  const [samplingInterval, setSamplingInterval] = useState(initialValues?.interval || 25);

  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [showOriginMenu, setShowOriginMenu] = useState(false);
  const [showDestMenu, setShowDestMenu] = useState(false);

  useEffect(() => {
    if (initialValues) {
      if (initialValues.origin) setOrigin(initialValues.origin);
      if (initialValues.destination) setDestination(initialValues.destination);
      if (initialValues.weight) setLoadWeight(initialValues.weight);
      if (initialValues.interval) setSamplingInterval(initialValues.interval);
    }
  }, [initialValues]);

  // Autocomplete fetcher
  const handleOriginChange = async (val) => {
    setOrigin(val);
    if (val.length >= 2) {
      const items = await searchLocations(val);
      setOriginSuggestions(items);
      setShowOriginMenu(true);
    } else {
      setShowOriginMenu(false);
    }
  };

  const handleDestChange = async (val) => {
    setDestination(val);
    if (val.length >= 2) {
      const items = await searchLocations(val);
      setDestSuggestions(items);
      setShowDestMenu(true);
    } else {
      setShowDestMenu(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      origin,
      destination,
      departureTime: new Date(departureTime).toISOString(),
      loadWeightLb: Number(loadWeight),
      samplingIntervalMiles: Number(samplingInterval),
    });
  };

  // Determine load rule threshold note
  let loadRuleNotice = null;
  const numWeight = Number(loadWeight);
  if (numWeight > 40000) {
    loadRuleNotice = 'Load > 40,000 lb: 35–44 mph winds elevate to Severe; 45–54 mph elevate to No Travel.';
  } else if (numWeight > 30000) {
    loadRuleNotice = 'Load > 30,000 lb: 45–54 mph winds elevate to No Travel.';
  }

  return (
    <div className="route-form-card">
      <div className="form-title">
        <span>Trip Configuration</span>
        <span style={{ color: 'var(--accent-cyan)', fontSize: '0.72rem' }}>3 Routes Evaluated</span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Origin */}
        <div className="form-group">
          <label className="form-label">Origin Location</label>
          <div className="input-with-icon">
            <MapPin size={16} className="input-icon" />
            <input
              type="text"
              className="form-input"
              value={origin}
              onChange={(e) => handleOriginChange(e.target.value)}
              onFocus={() => origin.length >= 2 && setShowOriginMenu(true)}
              onBlur={() => setTimeout(() => setShowOriginMenu(false), 200)}
              placeholder="e.g. Chicago, IL or lat,lng"
              required
            />
          </div>
          {showOriginMenu && originSuggestions.length > 0 && (
            <div className="autocomplete-menu">
              {originSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="autocomplete-item"
                  onMouseDown={() => {
                    setOrigin(item.name);
                    setShowOriginMenu(false);
                  }}
                >
                  {item.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Destination */}
        <div className="form-group">
          <label className="form-label">Destination Location</label>
          <div className="input-with-icon">
            <MapPin size={16} className="input-icon" />
            <input
              type="text"
              className="form-input"
              value={destination}
              onChange={(e) => handleDestChange(e.target.value)}
              onFocus={() => destination.length >= 2 && setShowDestMenu(true)}
              onBlur={() => setTimeout(() => setShowDestMenu(false), 200)}
              placeholder="e.g. Denver, CO or lat,lng"
              required
            />
          </div>
          {showDestMenu && destSuggestions.length > 0 && (
            <div className="autocomplete-menu">
              {destSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="autocomplete-item"
                  onMouseDown={() => {
                    setDestination(item.name);
                    setShowDestMenu(false);
                  }}
                >
                  {item.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Departure Time & Interval */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Departure Date / Time</label>
            <div className="input-with-icon">
              <Calendar size={16} className="input-icon" />
              <input
                type="datetime-local"
                className="form-input"
                style={{ paddingLeft: '34px', fontSize: '0.78rem' }}
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Sample Every</label>
            <div className="interval-selector">
              {[10, 25, 50].map((intVal) => (
                <button
                  key={intVal}
                  type="button"
                  className={`interval-btn ${samplingInterval === intVal ? 'active' : ''}`}
                  onClick={() => setSamplingInterval(intVal)}
                >
                  {intVal} mi
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Load Weight */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label">Truck Load Weight</label>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {Number(loadWeight).toLocaleString()} lb
            </span>
          </div>

          <div className="input-with-icon">
            <Scale size={16} className="input-icon" />
            <input
              type="number"
              min="0"
              max="100000"
              step="500"
              className="form-input"
              value={loadWeight}
              onChange={(e) => setLoadWeight(e.target.value)}
              placeholder="e.g. 35000"
              required
            />
          </div>

          {/* Quick Weight Chips */}
          <div className="weight-presets">
            {[
              { label: 'Empty (15k)', val: 15000 },
              { label: 'Med (28k)', val: 28000 },
              { label: 'Heavy (35k)', val: 35000 },
              { label: 'Max (44k)', val: 44000 },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                className={`weight-chip ${Number(loadWeight) === preset.val ? 'active' : ''}`}
                onClick={() => setLoadWeight(preset.val)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Load rule notice */}
          {loadRuleNotice && (
            <div className="load-rule-hint">
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{loadRuleNotice}</span>
            </div>
          )}
        </div>

        {/* Calculate Button */}
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              <span>Evaluating Weather Along Routes...</span>
            </>
          ) : (
            <>
              <span>Evaluate Safest Routes</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
