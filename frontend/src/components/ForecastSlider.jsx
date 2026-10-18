import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Wind, CloudRain, ShieldAlert } from 'lucide-react';

export default function ForecastSlider({
  hourOffset,
  onChangeHour,
  heatmapMode,
  onChangeHeatmapMode,
  departureTime,
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play animation through 48 hours
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        onChangeHour((prev) => {
          if (prev >= 48) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 700); // 700ms per hour step
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, onChangeHour]);

  // Compute timestamp at hourOffset
  const depDate = departureTime ? new Date(departureTime) : new Date();
  const targetDate = new Date(depDate.getTime() + hourOffset * 3600 * 1000);
  const formattedTime = targetDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="forecast-slider-container">
      <div className="slider-header">
        <div className="slider-title-group">
          <div className="slider-title">
            <Clock size={16} color="var(--accent-cyan)" />
            <span>Trip Corridor Forecast Slider (0–48h)</span>
          </div>
          <span className="current-hour-badge">
            {hourOffset === 0 ? 'Departure (T+0h)' : `T + ${hourOffset} Hours`} • {formattedTime}
          </span>
        </div>

        <div className="slider-controls">
          {/* Heatmap Layer Selector */}
          <div className="heatmap-mode-selector">
            <button
              className={`mode-btn ${heatmapMode === 'risk' ? 'active' : ''}`}
              onClick={() => onChangeHeatmapMode('risk')}
              title="Corridor Composite Risk Heatmap"
            >
              Risk Heat
            </button>
            <button
              className={`mode-btn ${heatmapMode === 'wind' ? 'active' : ''}`}
              onClick={() => onChangeHeatmapMode('wind')}
              title="Wind Speed Gradient"
            >
              Wind (mph)
            </button>
            <button
              className={`mode-btn ${heatmapMode === 'precip' ? 'active' : ''}`}
              onClick={() => onChangeHeatmapMode('precip')}
              title="Precipitation Intensity"
            >
              Rain/Snow
            </button>
          </div>

          {/* Reset Button */}
          <button
            className="btn-play"
            style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.1)', color: '#fff' }}
            onClick={() => {
              setIsPlaying(false);
              onChangeHour(0);
            }}
            title="Reset to departure time"
          >
            <RotateCcw size={13} />
          </button>

          {/* Play / Pause Toggle */}
          <button
            className="btn-play"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause animation' : 'Play 48-hour forecast timeline'}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 2 }} />}
          </button>
        </div>
      </div>

      {/* Range Slider Track */}
      <div className="slider-track-wrap">
        <input
          type="range"
          min="0"
          max="48"
          step="1"
          value={hourOffset}
          onChange={(e) => {
            setIsPlaying(false);
            onChangeHour(Number(e.target.value));
          }}
          className="range-input"
        />
        <div className="slider-ticks">
          <span>T+0h (Departure)</span>
          <span>T+12h</span>
          <span>T+24h (Day 1)</span>
          <span>T+36h</span>
          <span>T+48h (Day 2)</span>
        </div>
      </div>
    </div>
  );
}
