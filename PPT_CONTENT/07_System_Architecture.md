# 07 — System Architecture & Component Design

---

## 1. High-Level Architectural Diagram

AstroCare utilizes a modern, modular, full-stack decoupled architecture. The frontend is built on **React 19** and **TypeScript** with Vite, while the backend leverages **FastAPI**, **SQLite**, and **scikit-learn**.

```mermaid
graph TD
    subgraph Data Sources & Ingestion
        S1["Simulated Telemetry Studio<br/>(30-min physiological packets)"] --> INGEST["Ingestion API & Validator"]
        S2["Environmental ECLSS Sensors<br/>(O2, CO2, Pressure)"] --> INGEST
        S3["CSV Historical Datasets<br/>(NASA HRP Baselines)"] --> INGEST
    end

    subgraph Backend Core (FastAPI & Python)
        INGEST --> DB[("SQLite Database<br/>(Readings, Alerts, Reports)")]
        DB --> ML["AI Anomaly Engine<br/>(Isolation Forest Model)"]
        ML --> RISK["Intelligent Risk Correlator<br/>(NASA Hazard Matrix)"]
        RISK --> ALERT_SVC["Alert & Notification Service"]
        DB --> REP_SVC["Mission Report Generator"]
    end

    subgraph Frontend Subsystem (React 19 & TypeScript)
        API_LAYER["API & Resilience Layer<br/>(Auto-Failover / Client Simulator)"]
        AUTH_CTX["Auth & Crew State<br/>(Astronaut Profile Context)"]
        
        API_LAYER --> DASH["Live Monitoring Console (/dashboard)"]
        API_LAYER --> ANALYTICS["Health Analytics (/dashboard/analytics)"]
        API_LAYER --> AI_PAGE["AI Insights & Risk Engine (/ai-insights)"]
        API_LAYER --> ALERTS["Alert & Triage Center (/dashboard/alerts)"]
        API_LAYER --> REPORTS["Mission Reports (/dashboard/reports)"]
        API_LAYER --> RES_HUB["NASA & CSA Research Hub (/research)"]
    end

    ALERT_SVC -.-> API_LAYER
    RISK -.-> API_LAYER
    DB -.-> API_LAYER
```

---

## 2. Frontend Subsystem Architecture

### Component Hierarchy & Layout Uniformity
The entire application adheres to a unified layout structure:
- **Global Navbar (`Navbar.tsx`):** Fixed frosted-glass navigation (`height: 64px`) with dynamic route indicator, active crew badge, and Launch Console CTA.
- **Top Spacing & Container:** Every page is enclosed within a responsive `.container` with `max-width: 1400px`, centered alignment, and `paddingTop: 80px`.
- **Global Error Boundary (`ErrorBoundary.tsx`):** Wraps all dynamic route segments to isolate rendering exceptions and prevent white-screen crashes.
- **Dynamic Code-Splitting (`React.lazy`):** All 15 page views are loaded on demand, cutting the initial bundle size from `1,015 kB` to `342 kB`.
- **Global Footer (`Footer.tsx`):** Displays telemetry status and mandatory NASA Space Apps Challenge research disclaimers.

```
App.tsx
├── AuthProvider (AuthContext.tsx & useAuth.ts)
└── StarfieldBackground (Animated canvas)
    └── ErrorBoundary
        └── Suspense (PageLoadingFallback)
            ├── Navbar (Site-wide top navigation)
            ├── Routes (15 Code-split views)
            │   ├── LandingPage (/)
            │   ├── DashboardLayout (/dashboard)
            │   │   ├── DashboardOverview (index)
            │   │   ├── HealthAnalyticsPage (analytics)
            │   │   ├── AlertCenterPage (alerts)
            │   │   ├── AstronautProfilePage (profile)
            │   │   ├── MissionReportsPage (reports)
            │   │   ├── DataSimulatorPage (simulator)
            │   │   └── SettingsPage (settings)
            │   ├── AIInsightsPage (/ai-insights)
            │   ├── MissionDataPage (/mission-data)
            │   ├── ResearchHubPage (/research)
            │   └── AboutPage (/about)
            └── Footer (Site-wide research footer)
```

---

## 3. Backend Subsystem Architecture

### FastAPI Clean REST API Structure
The backend is organized into clear domain layers:
- **`app/api/`:** Clean API endpoints (`metrics.py`, `anomalies.py`, `alerts.py`, `reports.py`, `simulator.py`, `astronauts.py`, `readings.py`, `datasets.py`).
- **`app/services/`:** Business logic separation (`anomaly_service.py`, `alert_service.py`, `report_service.py`, `simulator_service.py`).
- **`app/ml/`:** Scikit-learn machine learning pipeline (`anomaly_detector.py`).
- **`app/core/`:** Database session management, SQLite engine initialization, configuration settings (`config.py`, `database.py`).
- **`app/schemas/`:** Strict Pydantic v2 data validation schemas (`schemas.py`).

---

## 4. Resilience & Offline Architectural Pattern

For spaceflight and analog missions where the backend server may be starting up, unreachable, or in sandbox isolation:
1. **API Resilience Layer:** The frontend features automated failover handlers in `loadData`, `runAnalysis`, and `fetchTrends`.
2. **Deterministic Spaceflight Fallback:** When the backend API is offline, client-side algorithms compute calibrated physiological telemetry, Isolation Forest scores, and spaceflight alert catalogs.
3. **Seamless State Persistence:** Local updates (e.g. alert triage notes, astronaut baselines, simulator steps) persist reliably in memory and browser local storage.

