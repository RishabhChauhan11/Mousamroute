# Weather-Aware Truck Routing — Project Specification & Context

*Derived from the Spotter Full Stack Developer Technical Assessment.*

---

## 1. Project Overview

**Weather-Aware Truck Routing** is a full-stack web application built with **React** and **Django** designed to help truck drivers and fleet dispatchers choose the safest and most efficient route among multiple options based on:
1. Real-time and forecasted weather conditions along the transit corridor.
2. Truck load weight (which affects vehicle stability in high winds).
3. Travel time and distance.

---

## 2. Core Functional Requirements

### 2.1 User Inputs
The application requires the user to input:
- **Origin & Destination**: Locations (address, city/state, or coordinates) geocoded for routing.
- **Departure Date & Time**: Used to compute the truck's estimated time of arrival (ETA) at each checkpoint along the journey.
- **Load Weight**: Weight in pounds (lb), used to apply specialized stability/risk modifier rules.
- *(User-configurable setting)* **Sampling Interval**: Weather checkpoint frequency (10, 25, or 50 miles; defaults to 25 miles).

### 2.2 System Capabilities
1. **Multi-Route Generation**:
   - Generate **3 route options** using a routing API (e.g., OSRM / OpenRouteService).
   - Display all 3 routes on an interactive map.

2. **Checkpoint Weather Sampling**:
   - Sample route geometry at intervals of **10, 25, or 50 miles**.
   - Calculate the estimated arrival time (ETA) at each checkpoint based on cumulative travel time from departure.
   - Query hourly weather forecasts corresponding to the exact arrival timestamp at each checkpoint coordinate.

3. **Risk & Load Rule Calculation**:
   - Classify weather conditions (Wind, Rain, Snow) into risk tiers.
   - Apply specific truck load weight rules that elevate risk levels under high wind conditions.
   - Aggregate risk metrics per checkpoint and per route.

4. **Intelligent Route Recommendation**:
   - Rank and recommend the optimal route according to the defined decision hierarchy.
   - Provide clear explanatory rationale for why a route is recommended.

5. **Interactive Map & Corridor Weather Heatmap**:
   - Render all 3 routes, checkpoints, risk levels, ETAs, and route summaries on an interactive map.
   - Display a **weather heatmap** along the trip corridor.
   - Include a **0–48 hour forecast slider** allowing the user to scrub forward in time and observe changing weather conditions along the corridor.

---

## 3. Risk Rules & Thresholds

### 3.1 Base Weather Thresholds (at Checkpoints)

| Condition | Low Risk | Moderate Risk | High Risk | Severe Risk | No Travel |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wind Speed** | `< 25 mph` | `25 – 34 mph` | `35 – 44 mph` | `45 – 54 mph` | `≥ 55 mph` |
| **Precipitation (Rain)** | `< 0.10 in/hr` | `0.10 – 0.25 in/hr` | `0.25 – 0.50 in/hr` | `0.50 – 1.00 in/hr` | `> 1.00 in/hr` |
| **Precipitation (Snow)** | `< 0.5 in/hr` | `0.5 – 1.0 in/hr` | `1.0 – 2.0 in/hr` | `2.0 – 3.0 in/hr` | `> 3.0 in/hr` |

### 3.2 Load Rules (Wind & Weight Interaction)

Truck stability is compromised by crosswinds depending on gross vehicle load weight:
- **Rule 1**: Wind $\ge 55\text{ mph} \longrightarrow$ **No Travel** for *any* load.
- **Rule 2**: Wind $45 – 54\text{ mph}$ **AND** Load Weight $> 30,000\text{ lb} \longrightarrow$ **No Travel** *(elevated from Severe)*.
- **Rule 3**: Wind $35 – 44\text{ mph}$ **AND** Load Weight $> 40,000\text{ lb} \longrightarrow$ **Severe** *(elevated from High)*.

### 3.3 Overall Checkpoint Risk
The risk level at any single checkpoint is determined by taking the **maximum** risk among Wind (after load rule adjustments), Rain, and Snow:
$$\text{Checkpoint Risk} = \max(\text{Wind Risk}_{\text{adjusted}}, \text{Rain Risk}, \text{Snow Risk})$$

Risk levels are ordered:
$$\text{Low (1)} < \text{Moderate (2)} < \text{High (3)} < \text{Severe (4)} < \text{No Travel (5)}$$

---

## 4. Route Recommendation Hierarchy

When comparing the candidate routes, the system ranks them using a strict lexicographical preference order:

1. **Fewest No Travel & Severe Miles** (primary filter for safety)
2. **Fewest High Risk Miles**
3. **Lowest Average Risk Score**
4. **Shortest Travel Time** (duration)

The winning route is flagged as **Recommended** with transparent metrics justifying the selection over alternatives.

---

## 5. Third-Party APIs

- **Routing & Geocoding**: OSRM (Open Source Routing Machine) / OpenRouteService / Nominatim.
- **Weather Forecasting**: Open-Meteo API (free, hourly forecasts 0–48h, wind speeds in mph, precipitation/snow in inches, no API key bottleneck).

---

## 6. Deliverables & Evaluation Criteria

### Deliverables
- **GitHub Repository**: Clean, well-structured, production-ready codebase without plagiarism, following standard software engineering design patterns.
- **Hosted Application**: Easily runnable locally via development servers or Docker, and ready for cloud deployment (e.g., Render, Railway, Vercel).
- **5–10 min Loom Walkthrough**: Video presentation script and guide outlining architecture, risk algorithm, map interactions, and test cases.

### Evaluation Weights
- **40% Routes, Weather, Risk & Recommendation Logic**: Accuracy of checkpoint interpolation, time-shifted weather lookups, load weight logic, and recommendation ranking.
- **35% UI, Map & Heatmap Smoothness and Performance**: Interactive Leaflet/MapLibre map, route polyline switching, checkpoint inspection popups, corridor heatmap, 0–48h time slider, responsive controls.
- **10% Code Quality**: Clean modular separation of concerns, comprehensive unit tests, input validation, typing, error handling, and documentation.
- **5% Documentation & Walkthrough**: Clear instructions, architecture diagrams, and Loom recording script.

*Guiding Directive: "Prioritize correctness and clarity over extra features."*
