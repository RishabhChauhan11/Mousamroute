/**
 * API client for interacting with the WeatherRoute Django backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function analyzeRoutes({
  origin,
  destination,
  departureTime,
  loadWeightLb,
  samplingIntervalMiles,
}) {
  const payload = {
    origin,
    destination,
    departure_time: departureTime || new Date().toISOString(),
    load_weight_lb: Number(loadWeightLb),
    sampling_interval_miles: Number(samplingIntervalMiles) || 25,
  };

  const response = await fetch(`${API_BASE_URL}/api/routes/analyze/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to analyze routes';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errData.error || JSON.stringify(errData);
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await response.json();
}

export async function searchLocations(query) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/geocoding/search/?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Geocoding search failed:', e);
  }
  return [];
}
