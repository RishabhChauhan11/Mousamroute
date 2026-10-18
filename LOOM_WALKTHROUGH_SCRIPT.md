# 5–10 Minute Loom Walkthrough Script

*Use this structured walkthrough to deliver a concise, high-impact demonstration of the Weather-Aware Truck Routing system for evaluation.*

---

## ⏱️ Video Outline & Timing Breakdown

| Timestamp | Section | Key Talking Points |
| :--- | :--- | :--- |
| **0:00 – 1:00** | **Introduction & Problem Overview** | Project purpose, target user (freight dispatchers & drivers), core challenges of crosswind rollover risk. |
| **1:00 – 2:30** | **Technical Architecture** | Django REST Framework modular services + React Leaflet modern UI; OSRM & Open-Meteo integration. |
| **2:30 – 4:30** | **Risk Evaluation & Load Rules** | Wind, rain, snow thresholds; $>30\text{k lb}$ and $>40\text{k lb}$ load weight penalty rules; 4-tier recommendation hierarchy. |
| **4:30 – 7:00** | **Live Interactive UI Demo** | Evaluating 3 routes from Chicago to Denver; comparing route metrics; clicking checkpoint popups showing ETAs and load penalties. |
| **7:00 – 8:30** | **Heatmap & 0–48h Forecast Slider** | Scrubbing the forecast slider; animated play/pause; switching between Risk Heat, Wind Speed, and Rain/Snow layers. |
| **8:30 – 9:30** | **Code Quality & Automated Testing** | Reviewing `pytest` test suite (16 tests passed: risk calculations, checkpoint interpolation, tie-breaking, API integration). |
| **9:30 – 10:00** | **Wrap Up & Deliverables** | Docker setup, clean architecture, focus on correctness over superfluous features. |

---

## 🎙️ Step-by-Step Speaking Script

### 1. Introduction (0:00 – 1:00)
> *"Hello everyone! Today I’m walking through my submission for the Spotter Full Stack Developer assessment: **Weather-Aware Truck Routing**.*
>
> *The objective was to build a production-grade React + Django web app that helps commercial truck drivers and dispatchers choose the safest transit corridor by factoring in real-time weather forecasts along the route, truck load weight, and travel time.*
>
> *Unlike conventional passenger navigation which only optimizes for shortest distance, commercial semi-trucks face severe rollover risks under strong crosswinds, especially when hauling heavier gross loads. This application solves that by actively evaluating weather risk at estimated times of arrival (ETAs) and recommending the optimal route."*

---

### 2. Architecture & Design Principles (1:00 – 2:30)
> *"For the backend, I built a modular Django REST Framework service structured around single-responsibility domain services:*
> 1. `osrm_service.py`*: Queries the OSRM Driving API with alternatives and geometric corridor fallbacks to guarantee 3 realistic driving routes.*
> 2. `checkpoint_sampler.py`*: Computes spatial geodesic distances using the Haversine formula, sampling checkpoints every 10, 25, or 50 miles, and calculating exact arrival timestamps.*
> 3. `weather_service.py`*: Queries Open-Meteo's hourly forecasting API in batched requests, caching responses to ensure sub-second response times.*
> 4. `risk_evaluator.py`*: Encapsulates the exact risk thresholds and load weight stability rules.*
> 5. `route_recommender.py`*: Implements the 4-tier decision hierarchy.*
>
> *On the frontend, I used React with Vite, Leaflet, and a custom dark logistics theme built with Vanilla CSS for maximum performance, crisp typography, and fluid micro-animations."*

---

### 3. Risk Rules & Load Modifiers (2:30 – 4:30)
*(Screen share: Click the "Risk & Load Rules" modal in the top header)*
> *"Let’s look at the core domain logic from the specification. Weather conditions at each checkpoint are classified across five tiers: Low, Moderate, High, Severe, and No Travel.*
> - *Wind: $<25$ mph is Low, $25-34$ is Moderate, $35-44$ is High, $45-54$ is Severe, and $\ge 55$ mph is No Travel.*
> - *Rain and Snow follow precise precipitation rate thresholds.*
>
> *Crucially, we incorporate the truck load weight modifiers:*
> - *Winds $\ge 55\text{ mph}$ trigger **No Travel** for any load.*
> - *Winds $45-54\text{ mph}$ combined with a load $>30,000\text{ lb}$ elevate risk to **No Travel**.*
> - *Winds $35-44\text{ mph}$ combined with a load $>40,000\text{ lb}$ elevate risk to **Severe**.*
>
> *When recommending the winning route, the algorithm follows the strict 4-step hierarchy:*
> 1. *Fewest No Travel & Severe miles (Primary safety guarantee)*
> 2. *Fewest High miles*
> 3. *Lowest average corridor risk score*
> 4. *Shortest travel time"*

---

### 4. Live UI Walkthrough (4:30 – 7:00)
*(Screen share: Click "Crosswind Heavy Load (CHI → DEN)" preset)*
> *"Now let's see it in action. Here we have a route from Chicago, IL to Denver, CO with a 42,000 lb load. Notice how our load weight indicator immediately alerts the driver that stability penalties are active.*
>
> *Upon evaluation, the backend generates 3 distinct corridors. In the left panel, the routes are displayed side-by-side with color-coded risk mileage bars:*
> - *Notice Route 1 is awarded the glowing 'RECOMMENDED SAFEST ROUTE' badge.*
> - *It provides an explicit rationale explaining why it was chosen—in this case, avoiding severe mountain crosswinds that Route 2 encounters.*
>
> *On the interactive map, we see the full route corridor rendered on an Esri Dark Gray canvas. Clicking any checkpoint pin opens an inspection card displaying:*
> - *Exact cumulative mileage and arrival ETA.*
> - *Wind speed, rain rate, snowfall, and temperature.*
> - *Any active load penalty banners applied to that checkpoint."*

---

### 5. Heatmap & 0–48h Forecast Slider (7:00 – 8:30)
*(Screen share: Scrub the bottom slider and press Play)*
> *"One of the standout features required in the specification is the corridor weather heatmap with a 0 to 48-hour forecast slider.*
>
> *At the bottom of the screen, we can drag the slider forward in time. Notice how the corridor heatmap smoothly reflects changing weather patterns across Day 1 and Day 2.*
> - *We can press 'Play' to watch an animated timeline progression.*
> - *We can also toggle between 'Risk Heat', 'Wind (mph)', and 'Rain/Snow' layers.*
>
> *This allows fleet dispatchers not just to check departure conditions, but to model what happens if a driver departs 6 or 12 hours later."*

---

### 6. Automated Testing & Code Quality (8:30 – 9:30)
*(Screen share: Terminal running `pytest`)*
> *"Let's look at code quality and automated testing. In the backend directory, running `pytest` executes 16 unit and integration tests:*
> - `test_risk_evaluator.py`*: Validates every wind, rain, and snow threshold, along with all load weight penalty conditions.*
> - `test_checkpoint_sampler.py`*: Validates Haversine distance calculations and ETA interpolation.*
> - `test_recommender.py`*: Validates that the 4-tier preference hierarchy resolves ties correctly.*
> - `test_api.py`*: End-to-end integration tests verifying request validation and response contracts.*
>
> *All 16 tests pass in a fraction of a second."*

---

### 7. Conclusion (9:30 – 10:00)
> *"In summary, this implementation strictly adheres to every requirement in the PDF: generating 3 routes, sampling checkpoints with time-shifted ETAs, applying gross load stability rules, displaying an interactive corridor heatmap with a 0-48h slider, and backing it with clean, fully tested code.*
>
> *The project includes Docker Compose for instant one-command deployment. Thank you for your time and consideration!"*
