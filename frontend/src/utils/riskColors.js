/**
 * Risk classification colors, labels, and formatting utilities.
 */

export const RISK_CONFIG = {
  Low: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: '#34d399',
    label: 'Low Risk',
    windThreshold: '< 25 mph',
    rainThreshold: '< 0.10 in/hr',
    snowThreshold: '< 0.5 in/hr',
  },
  Moderate: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    text: '#fbbf24',
    label: 'Moderate',
    windThreshold: '25–34 mph',
    rainThreshold: '0.10–0.25 in/hr',
    snowThreshold: '0.5–1.0 in/hr',
  },
  High: {
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.14)',
    border: 'rgba(249, 115, 22, 0.35)',
    text: '#fb923c',
    label: 'High Risk',
    windThreshold: '35–44 mph',
    rainThreshold: '0.25–0.50 in/hr',
    snowThreshold: '1.0–2.0 in/hr',
  },
  Severe: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.4)',
    text: '#f87171',
    label: 'Severe Risk',
    windThreshold: '45–54 mph',
    rainThreshold: '0.50–1.00 in/hr',
    snowThreshold: '2.0–3.0 in/hr',
  },
  'No Travel': {
    color: '#991b1b',
    bg: 'rgba(153, 27, 27, 0.25)',
    border: 'rgba(239, 68, 68, 0.7)',
    text: '#fca5a5',
    label: 'NO TRAVEL',
    windThreshold: '≥ 55 mph (or 45–54 mph + >30k lb)',
    rainThreshold: '> 1.00 in/hr',
    snowThreshold: '> 3.0 in/hr',
  },
};

export function getRiskColor(riskLevel) {
  return RISK_CONFIG[riskLevel]?.color || '#94a3b8';
}

export function getRiskBadgeStyle(riskLevel) {
  const conf = RISK_CONFIG[riskLevel] || {
    bg: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.3)',
    text: '#94a3b8',
  };
  return {
    backgroundColor: conf.bg,
    borderColor: conf.border,
    color: conf.text,
  };
}

export function formatWeight(lbs) {
  if (!lbs && lbs !== 0) return '0 lb';
  return Number(lbs).toLocaleString() + ' lb';
}

export function formatMiles(miles) {
  return Number(miles || 0).toFixed(1) + ' mi';
}
