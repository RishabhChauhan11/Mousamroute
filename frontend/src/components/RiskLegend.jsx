import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { RISK_CONFIG } from '../utils/riskColors';

export default function RiskLegend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="floating-legend">
      <div
        className="legend-title"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={13} color="var(--accent-cyan)" />
          <span>Risk Classification</span>
        </div>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </div>

      {!collapsed && (
        <div className="legend-items">
          {Object.entries(RISK_CONFIG).map(([level, cfg]) => (
            <div key={level} className="legend-item">
              <div className="legend-item-left">
                <span className="legend-dot" style={{ backgroundColor: cfg.color }} />
                <span style={{ fontWeight: 600, color: cfg.text }}>{level}</span>
              </div>
              <span className="legend-val">{cfg.windThreshold}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              lineHeight: 1.3,
            }}
          >
            *Max risk of Wind, Rain, Snow. Crosswinds &gt; 30k/40k lb loads elevate risk tier.
          </div>
        </div>
      )}
    </div>
  );
}
