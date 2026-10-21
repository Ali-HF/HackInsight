---
title: HackInsight Pipeline Monitoring
emoji: 🌫️
colorFrom: blue
colorTo: indigo
sdk: gradio
sdk_version: 5.50.0
app_file: app.py
pinned: false
license: mit
short_description: Operational telemetry and execution monitoring for HackInsight PM2.5 forecasting
---

# 🌫️ HackInsight — Pipeline Monitoring

This Hugging Face Space serves as the official **Operational Telemetry & Observability Dashboard** for the **Pakistan PM2.5 Forecasting and Decision-Support System (HackInsight 2026)**.

The primary citizen and user-facing frontend is built in React 19 / TypeScript and deployed on Vercel at [web-livid-eight-rcllafnbqq.vercel.app](https://web-livid-eight-rcllafnbqq.vercel.app). 

This Space complements the main frontend by providing real-time verification that our data ingestion pipeline, Data Quality Agent, ML forecasting engine ($t+24$ curve), and automated Prefect orchestration are active, reliable, and grounded.

---

## 🏛️ System Architecture

```
+-------------------------------------------------------------------------------+
|                       Upstream Data Ingestion Sources                         |
|  - PAQI ICARTT Ground Network (NASA Langley ASDC DAAC: 30 Stations)          |
|  - OpenAQ v3 Incremental Delta Fetcher (Exponential Backoff HTTP Retries)      |
|  - NASA POWER & Open-Meteo Hourly Meteorology Covariates                     |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                         Autonomous Quality Governance                         |
|  - Data Quality Agent (ValidationEngine)                                      |
|  - Zero-Fabrication Deterministic Actions: NO_ACTION, FLAG, FILL, FIX         |
|  - Temporal Continuity & Flatline Anomaly Detectors                           |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                          ML Forecasting Engine (t+24h)                        |
|  - HistGradientBoostingRegressor with Log1p Transform (40 Covariates)         |
|  - Conformal 80% Prediction Intervals ([lower_80, upper_80] ug/m3)            |
|  - Ground Truth vs. Seasonal Persistence Baseline (Persistence Naive)         |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                    Hourly Orchestration (Prefect 3.0)                         |
|  - Cron: 0 * * * * (Every hour on the hour in Asia/Karachi, UTC+5)            |
|  - Atomic Output Publishing (latest_forecast.json, latest_quality.json)       |
|  - Immutable Execution Audit Trail (run_history.json)                         |
+---------------------------------------+---------------------------------------+
                                        |
                    +-------------------+-------------------+
                    |                                       |
                    v                                       v
   +---------------------------------+     +----------------------------------+
   |   Vercel User Frontend (Web)    |     |  Hugging Face Space (Monitoring) |
   |   - TypeScript / React 19 / Vite|     |  - Gradio 6 Operational Telemetry|
   |   - Interactive Map & RAG Chat  |     |  - Component Health Status Cards |
   |   - Deployed on Vercel          |     |  - Execution Timeline & Auditing |
   +---------------------------------+     +----------------------------------+
```

---

## 🚦 Component Health Assessment Criteria

Statuses are calculated strictly from verifiable operational evidence:

| Component | Status Criteria |
| :--- | :--- |
| **Data Pipeline** | **HEALTHY** if latest ground observation is verified and within configured freshness threshold ({FRESHNESS_THRESHOLD_HOURS}h); **STALE** if age exceeds threshold; **FAILED** if data acquisition threw a fatal error. |
| **Data Quality Agent** | **HEALTHY** if validation status is `PASS`; **WARNING** if non-critical flags (`WARN`) are recorded with zero data corruption; **FAILED** if critical schema violation occurred. |
| **PM2.5 Forecasting Model** | **HEALTHY** if model artifact is loaded and verified 24h predictions are issued for Lahore and Karachi; **FAILED** if model unavailable. |
| **Insight / RAG Agent** | **HEALTHY** if numerical grounding verification passed on latest run (`agent_grounding_passed == True`) with zero hallucination. |
| **Automated Orchestration** | **HEALTHY** if last Prefect execution status was `SUCCESS`; **FAILED** if run recorded failure status or exceptions. |

---

## ⚙️ Environment Variables & Space Secrets

Configure these optional settings under **Space Settings > Variables and Secrets**:

| Variable / Secret | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `FRESHNESS_THRESHOLD_HOURS` | Variable | `24.0` | Maximum acceptable age (in hours) before marking telemetry stale. |
| `BACKEND_API_URL` | Variable | *(Empty)* | URL of remote backend API providing `/api/status`. If omitted, uses local artifacts or bundled operational snapshot. |
| `VERCEL_APP_URL` | Variable | `https://web-livid-eight-rcllafnbqq.vercel.app` | URL to the main TypeScript/Vercel application. |
| `GITHUB_REPO_URL` | Variable | `https://github.com/Ali-HF/HackInsight` | Link to the open-source code repository. |
| `PORT` | Variable | `7860` | Server listening port (default for Hugging Face Spaces). |

---

## 🚀 Deployment Instructions to Hugging Face Spaces

### Step 1: Create Space on Hugging Face
1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. Choose **Space Name**: `hackinsight-pipeline-monitoring`.
3. Select **License**: `mit`.
4. Select **Space SDK**: `Gradio`.
5. Select **Space Hardware**: `CPU basic (Free)`.

### Step 2: Push Repository
```bash
# Clone the empty Space repository
git clone https://huggingface.co/spaces/<YOUR_USERNAME>/hackinsight-pipeline-monitoring

# Copy files from huggingface-space/ directory into the Space repo
cp huggingface-space/* hackinsight-pipeline-monitoring/
cp -r huggingface-space/assets hackinsight-pipeline-monitoring/

# Commit and push
cd hackinsight-pipeline-monitoring
git add .
git commit -m "feat: deploy HackInsight operational monitoring space"
git push origin main
```

---

## 🔍 Manual Verification Checklist

- [ ] **Startup:** Space builds and initializes within 30 seconds on clean container.
- [ ] **Overview Cards:** All 5 status cards render with distinct badges and last verified timestamps.
- [ ] **Data Freshness:** Observation timestamp distinguishes from pipeline execution time.
- [ ] **Quality Governance:** Decision table displays `NO_ACTION`, `FLAG`, `FILL`, `FIX` counts without misrepresenting missing fields as zero.
- [ ] **City Predictions:** Verified $t+24$ forecasts for Lahore and Karachi display with 80% prediction intervals.
- [ ] **Execution History:** Execution log table lists recent runs with durations and error summaries.
- [ ] **Timeline Plot:** Timeline chart visually distinguishes successful (green) vs failed (red) runs.
- [ ] **Security:** No secrets or private tokens are leaked in any table or log view.
