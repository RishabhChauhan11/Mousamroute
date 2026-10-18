import React from 'react';
import { Award, Clock, Navigation, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { RISK_CONFIG, getRiskColor } from '../utils/riskColors';

export default function RouteCard({ route, isSelected, onSelect }) {
  const m = route.metrics;
  const isRec = route.is_recommended;

  // Calculate percentages for the stacked risk mileage bar
  const totalSampled = (m.no_travel_miles + m.severe_miles + m.high_miles + m.moderate_miles + m.low_miles) || 1;
  const noTravelPct = (m.no_travel_miles / totalSampled) * 100;
  const severePct = (m.severe_miles / totalSampled) * 100;
  const highPct = (m.high_miles / totalSampled) * 100;
  const modPct = (m.moderate_miles / totalSampled) * 100;
  const lowPct = (m.low_miles / totalSampled) * 100;

  return (
    <div
      className={`route-card ${isSelected ? 'selected' : ''} ${isRec ? 'recommended' : ''}`}
      onClick={() => onSelect(route.id)}
    >
      {isRec && (
        <div className="recommendation-badge">
          <Award size={13} />
          <span>RECOMMENDED SAFEST ROUTE</span>
        </div>
      )}

      <div className="route-card-header">
        <div className="route-name">
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: isRec ? '#10b981' : isSelected ? '#38bdf8' : '#64748b',
              display: 'inline-block',
            }}
          />
          <span>{route.name}</span>
        </div>
        <span className="route-rank-tag">Rank #{route.rank}</span>
      </div>

      {/* Main Stats Grid */}
      <div className="route-stats-grid">
        <div className="stat-item">
          <span className="stat-label">Distance</span>
          <span className="stat-value">{route.distance_miles.toFixed(1)} mi</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Travel Time</span>
          <span className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={13} color="var(--accent-cyan)" />
            {route.duration_formatted}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Corridor Risk</span>
          <span
            className="stat-value"
            style={{
              color:
                m.average_risk_score > 3
                  ? '#ef4444'
                  : m.average_risk_score > 2
                  ? '#f97316'
                  : m.average_risk_score > 1.5
                  ? '#f59e0b'
                  : '#10b981',
            }}
          >
            {m.average_risk_score.toFixed(2)} / 5.0
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Severe / High Exposure</span>
          <span
            className="stat-value"
            style={{ color: m.critical_miles > 0 ? '#ef4444' : m.high_miles > 0 ? '#f97316' : '#10b981' }}
          >
            {(m.critical_miles + m.high_miles).toFixed(1)} mi
          </span>
        </div>
      </div>

      {/* Stacked Risk Mileage Bar */}
      <div className="risk-mileage-bar" title="Route risk exposure proportion">
        {noTravelPct > 0 && (
          <div
            className="bar-segment"
            style={{ width: `${noTravelPct}%`, backgroundColor: RISK_CONFIG['No Travel'].color }}
          />
        )}
        {severePct > 0 && (
          <div
            className="bar-segment"
            style={{ width: `${severePct}%`, backgroundColor: RISK_CONFIG.Severe.color }}
          />
        )}
        {highPct > 0 && (
          <div
            className="bar-segment"
            style={{ width: `${highPct}%`, backgroundColor: RISK_CONFIG.High.color }}
          />
        )}
        {modPct > 0 && (
          <div
            className="bar-segment"
            style={{ width: `${modPct}%`, backgroundColor: RISK_CONFIG.Moderate.color }}
          />
        )}
        {lowPct > 0 && (
          <div
            className="bar-segment"
            style={{ width: `${lowPct}%`, backgroundColor: RISK_CONFIG.Low.color }}
          />
        )}
      </div>

      {/* Mileage Badges Row */}
      <div className="mileage-badges-row">
        {m.no_travel_miles > 0 && (
          <span
            className="risk-chip"
            style={{
              backgroundColor: RISK_CONFIG['No Travel'].bg,
              color: RISK_CONFIG['No Travel'].text,
              borderColor: RISK_CONFIG['No Travel'].border,
            }}
          >
            <AlertTriangle size={11} />
            {m.no_travel_miles.toFixed(1)} mi No Travel
          </span>
        )}
        {m.severe_miles > 0 && (
          <span
            className="risk-chip"
            style={{
              backgroundColor: RISK_CONFIG.Severe.bg,
              color: RISK_CONFIG.Severe.text,
              borderColor: RISK_CONFIG.Severe.border,
            }}
          >
            {m.severe_miles.toFixed(1)} mi Severe
          </span>
        )}
        {m.high_miles > 0 && (
          <span
            className="risk-chip"
            style={{
              backgroundColor: RISK_CONFIG.High.bg,
              color: RISK_CONFIG.High.text,
              borderColor: RISK_CONFIG.High.border,
            }}
          >
            {m.high_miles.toFixed(1)} mi High
          </span>
        )}
        <span
          className="risk-chip"
          style={{
            backgroundColor: RISK_CONFIG.Moderate.bg,
            color: RISK_CONFIG.Moderate.text,
            borderColor: RISK_CONFIG.Moderate.border,
          }}
        >
          {m.moderate_miles.toFixed(1)} mi Moderate
        </span>
        <span
          className="risk-chip"
          style={{
            backgroundColor: RISK_CONFIG.Low.bg,
            color: RISK_CONFIG.Low.text,
            borderColor: RISK_CONFIG.Low.border,
          }}
        >
          {m.low_miles.toFixed(1)} mi Low
        </span>
      </div>

      {/* Recommendation Rationale */}
      <div className="rationale-box">
        {isRec ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <ShieldCheck size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{route.recommendation_rationale}</span>
          </div>
        ) : (
          <div>{route.recommendation_rationale}</div>
        )}
      </div>
    </div>
  );
}
