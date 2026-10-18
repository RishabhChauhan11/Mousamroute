import React, { useState } from 'react';
import { Truck, ShieldAlert, Sparkles, HelpCircle, X } from 'lucide-react';

export default function Header({ onSelectPreset }) {
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Truck size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="brand-title">WeatherRoute</h1>
              <span className="brand-badge">SPOTTER AI</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Weather-Aware Dynamic Truck Routing Engine
            </p>
          </div>
        </div>

        <div className="header-actions">
          {/* Preset Demos */}
          <button
            className="presets-btn"
            onClick={() =>
              onSelectPreset({
                origin: 'Chicago, IL',
                destination: 'Denver, CO',
                weight: 42000,
                interval: 25,
              })
            }
            title="Demonstrates crosswind load rules with >40k lb load"
          >
            <Sparkles size={14} color="#38bdf8" />
            <span>Crosswind Heavy Load (CHI → DEN)</span>
          </button>

          <button
            className="presets-btn"
            onClick={() =>
              onSelectPreset({
                origin: 'New York, NY',
                destination: 'Atlanta, GA',
                weight: 28000,
                interval: 25,
              })
            }
            title="Demonstrates rainfall corridor routing"
          >
            <Sparkles size={14} color="#38bdf8" />
            <span>Rain Corridor (NYC → ATL)</span>
          </button>

          {/* Risk Matrix Spec Button */}
          <button
            className="presets-btn"
            onClick={() => setShowMatrixModal(true)}
            style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: 'var(--accent-cyan)' }}
          >
            <HelpCircle size={14} />
            <span>Risk & Load Rules</span>
          </button>
        </div>
      </header>

      {/* Risk Rules Modal */}
      {showMatrixModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowMatrixModal(false)}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              maxWidth: '640px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              color: '#f8fafc',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#38bdf8" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Risk Thresholds & Load Rules</h2>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '16px' }}>
              Exact classification tables and truck gross weight stability modifiers implemented from specification:
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginBottom: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8' }}>
                  <th style={{ padding: '8px' }}>Condition</th>
                  <th style={{ padding: '8px', color: '#10b981' }}>Low</th>
                  <th style={{ padding: '8px', color: '#f59e0b' }}>Moderate</th>
                  <th style={{ padding: '8px', color: '#f97316' }}>High</th>
                  <th style={{ padding: '8px', color: '#ef4444' }}>Severe</th>
                  <th style={{ padding: '8px', color: '#881337' }}>No Travel</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>Wind</td>
                  <td style={{ padding: '8px' }}>&lt;25 mph</td>
                  <td style={{ padding: '8px' }}>25–34</td>
                  <td style={{ padding: '8px' }}>35–44</td>
                  <td style={{ padding: '8px' }}>45–54</td>
                  <td style={{ padding: '8px', fontWeight: 700 }}>≥55 mph</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}>Rain</td>
                  <td style={{ padding: '8px' }}>&lt;0.10 in/hr</td>
                  <td style={{ padding: '8px' }}>0.10–0.25</td>
                  <td style={{ padding: '8px' }}>0.25–0.50</td>
                  <td style={{ padding: '8px' }}>0.50–1.00</td>
                  <td style={{ padding: '8px', fontWeight: 700 }}>&gt;1.00</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 600 }}>Snow</td>
                  <td style={{ padding: '8px' }}>&lt;0.5 in/hr</td>
                  <td style={{ padding: '8px' }}>0.5–1.0</td>
                  <td style={{ padding: '8px' }}>1.0–2.0</td>
                  <td style={{ padding: '8px' }}>2.0–3.0</td>
                  <td style={{ padding: '8px', fontWeight: 700 }}>&gt;3.0</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>
              Load Weight Rules (Crosswind Modifiers):
            </h3>
            <ul style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.6', paddingLeft: '20px', marginBottom: '16px' }}>
              <li><strong>≥ 55 mph</strong> → <strong>No Travel</strong> for any load weight.</li>
              <li><strong>45–54 mph + &gt; 30,000 lb</strong> → Elevated to <strong>No Travel</strong> (normally Severe).</li>
              <li><strong>35–44 mph + &gt; 40,000 lb</strong> → Elevated to <strong>Severe</strong> (normally High).</li>
            </ul>

            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
              Recommendation Decision Hierarchy:
            </h3>
            <ol style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5', paddingLeft: '20px' }}>
              <li>Fewest Severe / No-Travel miles (Primary safety guarantee)</li>
              <li>Fewest High miles</li>
              <li>Lowest average corridor risk score</li>
              <li>Shortest travel transit time</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
