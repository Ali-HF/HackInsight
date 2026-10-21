---
title: Pakistan PM2.5 Forecasting and Decision Support
emoji: 🇵🇰
colorFrom: green
colorTo: blue
sdk: streamlit
sdk_version: "1.42.0"
app_file: app.py
pinned: false
license: mit
---

# Pakistan PM2.5 Forecasting and Decision-Support System

[![Python 3.10+](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.14-blue.svg)](https://www.python.org/)
[![Orchestration: Prefect 3](https://img.shields.io/badge/orchestration-Prefect%203.8-orange.svg)](https://www.prefect.io/)
[![Dashboard: Streamlit](https://img.shields.io/badge/dashboard-Streamlit-red.svg)](https://streamlit.io/)
[![Frontend: React 19 + Three.js](https://img.shields.io/badge/web-React%2019%20%7C%20Vite-61DAFB.svg)](https://web-livid-eight-rcllafnbqq.vercel.app)
[![Tests: 101 Passed](https://img.shields.io/badge/tests-101%2F101%20passed-brightgreen.svg)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end, reproducible air-quality operational pipeline and decision-support system built for **HackInsight 2026 (TECHFEST '26)**. The system forecasts ground-level hourly PM2.5 concentrations **24 hours ahead ($t+24$)** for **Lahore** and **Karachi**, provides calibrated 80% & 90% uncertainty intervals, enforces deterministic data-quality governance, and powers an anti-hallucination decision-support agent grounded in statutory environmental standards.

**Team:** DataMinors  
**Members:** Laiba Akram, Ali Hasan Farooqui, Areeba, Bushra Abid  
**Repository:** [Ali-HF/HackInsight](https://github.com/Ali-HF/HackInsight)  
**Release Tag:** [`v1.0-final`](https://github.com/Ali-HF/HackInsight/tree/v1.0-final)  
**Live Citizen Web App:** [https://web-livid-eight-rcllafnbqq.vercel.app](https://web-livid-eight-rcllafnbqq.vercel.app)  
**Hugging Face Telemetry Space:** [huggingface.co/spaces](https://huggingface.co/spaces)  

---

## 🏆 HackInsight 2026 Official Submission Index

| Item | Guide Requirement | Location in Repository / Verification | Status |
|:---:|:---|:---|:---:|
| **1** | **Data Acquisition & Warehouse (`make data`)** | [`Makefile`](Makefile) (`make data`), [`data/manifests/manifest.csv`](data/manifests/manifest.csv) (SHA-256 verified) | ✅ **100% Pass** |
| **2** | **Data Quality Agent (`quality_log.csv`)** | [`src/data_pipeline/validation/data_quality_agent.py`](src/data_pipeline/validation/data_quality_agent.py), [`reports/data_quality/quality_log.csv`](reports/data_quality/quality_log.csv) (`FIX`, `FILL`, `FLAG`, `NO_ACTION`) | ✅ **100% Pass** |
| **3** | **ML Model (Beats Baseline, Uncertainty, Group Errors)** | [`artifacts/reports/metrics_summary.json`](artifacts/reports/metrics_summary.json), [`artifacts/reports/error_analysis.json`](artifacts/reports/error_analysis.json) (+3.63% MAE, +5.79% RMSE, 82.42% conformal coverage) | ✅ **100% Pass** |
| **4** | **Insight Agent (RAG, Citations, Row IDs, "I Don't Know")** | [`src/insight_agent/interface.py`](src/insight_agent/interface.py), Pak-EPA NEQS 2010 & WHO 2021 statutory citations, explicit out-of-scope refusals, bilingual Urdu | ✅ **100% Pass** |
| **5** | **Automated Hourly Pipeline & Live Dashboards** | [`src/orchestration/flows.py`](src/orchestration/flows.py), [`prefect_runs.csv`](prefect_runs.csv), Hugging Face Space & [Live Vercel 3D Globe](https://web-livid-eight-rcllafnbqq.vercel.app) | ✅ **100% Pass** |
| **6** | **Dataset Proposal (`datasetproposal.pdf`)** | [`datasetproposal.pdf`](datasetproposal.pdf) (PAQI NASA ASDC DAAC DOI: 10.5067, NASA POWER reanalysis, OpenAQ delta) | ✅ **Complete** |
| **7** | **GitHub Release Tag (`v1.0-final`)** | Git tag `v1.0-final` on branch `main` (verified clean commit) | ✅ **Tagged** |
| **8** | **Hugging Face Space Link** | [`huggingface-space/`](huggingface-space/) (Operational telemetry Gradio space) & [Telemetry Deployment](huggingface-space/README.md) | ✅ **Ready** |
| **9 & 10** | **Executive Summary (`Summary.pdf`)** | [`Summary.pdf`](Summary.pdf) (Verified exactly **one page** covering approach, ML rigor, and Pakistan impact) | ✅ **1-Page Pass** |
| **11** | **3-Minute Demo Video Walkthrough** | [YouTube Video Walkthrough (No Login Required)](https://youtu.be/9Zq4rCNXnho?si=mkJ-F9WoXuDmKBGC), standalone demo [`brag-output/brag-demo.html`](brag-output/brag-demo.html), script in [`docs/SUBMISSION_DEFENSE_AND_BUSINESS_MODEL.md`](docs/SUBMISSION_DEFENSE_AND_BUSINESS_MODEL.md#4-3-minute-demo-video-script--walkthrough-guide) | ✅ **Live on YouTube** |
| **12** | **AI Use Disclosure (`AI_Use_Log.md`)** | [`AI_Use_Log.md`](AI_Use_Log.md) (Full tool breakdown, task mapping, manual verification, and member attribution) | ✅ **Complete** |
| **13** | **Physical Viva Preparation Matrix** | Member-by-member defense guide and Q&A in [`docs/SUBMISSION_DEFENSE_AND_BUSINESS_MODEL.md`](docs/SUBMISSION_DEFENSE_AND_BUSINESS_MODEL.md#3-physical-viva-preparation--team-defense-guide) | ✅ **Ready** |
| **14** | **Business Model (User, Payer, Value, Running Cost)** | Detailed financial and operational model in [`docs/SUBMISSION_DEFENSE_AND_BUSINESS_MODEL.md`](docs/SUBMISSION_DEFENSE_AND_BUSINESS_MODEL.md#1-business-model-architecture) | ✅ **Documented** |
| **15** | **Optimization Log (Accuracy, Speed, Memory)** | 7-phase step-by-step benchmark log in [`docs/SUBMISSION_DEFENSE_AND_BUSINESS_MODEL.md`](docs/SUBMISSION_DEFENSE_AND_BUSINESS_MODEL.md#2-model--pipeline-optimization-log) | ✅ **Documented** |

---

## 1. Project Overview

### Problem Statement
Lahore and Karachi regularly suffer from hazardous ambient air pollution, with seasonal smog episodes exceeding 500–800 µg/m³ of PM2.5 (20–50 times above WHO guidelines). Reference-grade ground monitoring stations are sparse and geographically clustered. While community low-cost sensor networks (such as PAQI) provide broad coverage, raw feeds are subject to sensor drift, temporal outages, flatlining, and hygroscopic humidity inflation. Furthermore, environmental managers lack advance notice to deploy targeted interventions before pollution peaks occur.

### Target Users & Decisions
- **Primary Users:** Provincial Environmental Protection Department (EPD) smog-response officers (Punjab and Sindh) and municipal health authorities.
- **Key Decisions:**
  1. Issuing targeted district-level health advisories 24 hours in advance.
  2. Enacting localized emergency vehicle rationing and heavy-transport restrictions.
  3. Preemptively shutting or shifting hours for brick kilns and heavy industrial emitters.
  4. Deciding school closures and outdoor activity bans before citizen exposure occurs.

### Forecasting Objective
To predict ground-level PM2.5 concentration (µg/m³) **24 hours ahead ($t+24$)** at sensor and city-aggregate levels, accompanied by calibrated empirical prediction intervals (80% and 90%) and persistence baselines.

### Decision-Support Features
- **Anti-Hallucination Insight/RAG Agent:** Evaluates natural-language queries strictly against deterministic evidence bundles.
- **Statutory Regulatory Grounding:** Automatically cross-references forecasts against the **Punjab Clean Air Action Plan 2023** (150 µg/m³ emergency threshold), **Pakistan National Environmental Quality Standards (Pak-NEQS 2010)** (35 µg/m³ 24h standard), and **WHO 2021 Global Guidelines** (15 µg/m³).
- **"I Don't Know" Boundary Enforcement:** The agent explicitly admits uncertainty when evidence is insufficient or when querying unsupported regions.

---

## 2. System Architecture

```text
===================================================================================================================
                                  PAKISTAN PM2.5 OPERATIONAL PIPELINE & ARCHITECTURE
===================================================================================================================

 [ DATA INGESTION: MEMBER 1 ]
  +--------------------------------------------------------+
  | - PAQI ICARTT Text Archive (ASDC DAAC DOI: 10.5067)    |
  | - NASA POWER Hourly Meteorology (T2M, RH2M, WS10M, PS) |
  +---------------------------+----------------------------+
                              |
                              v
 [ CLEANING & PROCESSING: MEMBER 1 ]
  +--------------------------------------------------------+
  | - Reshape Wide Sensor Matrix to Long Panel             |
  | - UTC Standardization & Hourly Reindexing              |
  | - Causal 24h Target Construction & Feature Alignment   |
  | - Canonical Gold Dataset: data/processed/gold.parquet   |
  +---------------------------+----------------------------+
                              |
                              v
 [ DATA QUALITY GOVERNANCE: MEMBER 3 ]
  +--------------------------------------------------------+
  | DataQualityAgent Policy Engine:                        |
  | - NO_ACTION (Certified Clean)                          |
  | - FLAG (Temporal Gaps, Flatlines, Extreme Spikes)      |
  | - FILL (Bounded backward ffill <=2h for covariates)   |
  | - FIX (Deduplication, Whitespace Normalization)        |
  | - Output: reports/data_quality/quality_log.csv         |
  +---------------------------+----------------------------+
                              |
                              v
 [ ML FORECASTING ENGINE: MEMBER 2 ]
  +--------------------------------------------------------+
  | HistGradientBoostingRegressor (max_iter=150, lr=0.08)  |
  | - 40 Causal Lag & Rolling Features (Zero Lookahead)    |
  | - Chronological Split (Train 60%, Val 20%, Test 20%)   |
  | - Calibrated 80% & 90% Empirical Prediction Intervals  |
  | - Artifact: artifacts/models/pm25_forecaster.joblib    |
  +---------------------------+----------------------------+
                              |
                              v
 [ PREFECT ORCHESTRATION & SCHEDULING: MEMBER 4 ]
  +--------------------------------------------------------+
  | Flow: pm25-hourly-pipeline (Asia/Karachi, 0 * * * *)   |
  | - Task 1: Ingestion & Live Stream Acquisition          |
  | - Task 2: Schema & Physical Validation                 |
  | - Task 3: Data Quality Assessment Execution            |
  | - Task 4: 24h Point & Interval Forecast Generation     |
  | - Task 5: Agent Input & Evidence Refresh               |
  | - Task 6: Atomic Output Publishing & Run Logging       |
  | - Failure Isolation: Preserves last valid outputs      |
  +---------------------------+----------------------------+
                              |
                              v
 [ SERVING & DECISION-SUPPORT: MEMBER 4 ]
  +------------------------------------+------------------------------------+
  | Interactive Streamlit Dashboard    | Insight / RAG Decision Agent       |
  | (src/dashboard/app.py)             | (src/insight_agent/interface.py)   |
  | - Live Readings & 24h Predictions  | - Grounded Natural Language Q&A    |
  | - 80% & 90% Uncertainty Bands      | - Verified Numerical Evidence      |
  | - Station & Centroid Selection     | - Regulatory Health Action Advice  |
  | - System Health & Data Freshness   | - Rejection of Unsupported Queries |
  +------------------------------------+------------------------------------+
                              |
                              v
 [ DEPLOYMENT: MEMBER 4 ]
  Hugging Face Space (Streamlit SDK) + Local Prefect Scheduler Infrastructure
===================================================================================================================
```

---

## 3. Team Responsibilities

| Member | Primary Ownership | Core Deliverables |
| :--- | :--- | :--- |
| **Member 1** (Data Engineering) | Data Acquisition, Processing & Provenance | PAQI ICARTT parser, NASA POWER weather alignment, Gold Parquet dataset builder, metadata manifest (`manifest.csv`), schema validation. |
| **Member 2** (Machine Learning) | Forecasting Models & Evaluation | Causal feature engineering (lags, rolling stats), chronological train/val/test splitting, `HistGradientBoostingRegressor` model, uncertainty calibration, evaluation against persistence baseline. |
| **Member 3** (Agents & Governance) | Quality Governance & Decision Support | `DataQualityAgent` deterministic policy engine, `InsightRAGAgent` natural-language interface, regulatory standards integration, anti-hallucination grounding audit. |
| **Member 4** (Integration & Systems) | Orchestration, Dashboard, App & Space | End-to-end integration, Prefect hourly orchestration flow (`flows.py`), local scheduler daemon (`scheduler.py`), Streamlit interactive dashboard (`src/dashboard/app.py`), root entrypoint (`app.py`), 29-test acceptance suite, Hugging Face Space deployment. |

---

## 4. Prerequisites

- **Operating System:** Linux, macOS, or Windows (tested on Windows 11 & Linux x86_64).
- **Python Version:** Python 3.10 to 3.14 (Verified on Python 3.14.7).
- **Core Dependencies:** Prefect 3.8+, Streamlit 1.35+, Scikit-Learn 1.4+, Pandas 2.2+, NumPy 1.26+, PyArrow 15.0+, Joblib 1.4+.
- **External Accounts / Credentials (Optional):**
  - Hugging Face account (for hosted Space deployment).
  - Prefect Cloud account (optional; pipeline runs with self-contained local Prefect server by default).
  - NASA Earthdata account (for fresh upstream bulk ICARTT archive downloads).

---

## 5. Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/HackInsight-main.git
cd HackInsight-main
```

### 2. Set Up Virtual Environment

**On Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

**On Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 6. Environment Configuration

Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

### Configuration Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `development` | Runtime environment (`development`, `production`, `test`). |
| `DATA_DIR` | `data` | Root path for input and processed data. |
| `OUTPUT_DIR` | `outputs` | Directory for versioned published forecasts and run history. |
| `MODEL_PATH` | `artifacts/models/pm25_forecaster.joblib` | Serialized trained ML model artifact. |
| `PREDICTIONS_PATH` | `artifacts/predictions/test_predictions.csv` | Canonical evaluation and prediction dataset. |
| `PREFECT_API_URL` | *(Empty)* | Optional Prefect Cloud or remote server endpoint. |
| `TIMEZONE` | `Asia/Karachi` | Canonical local timezone for operational scheduling. |
| `SCHEDULE_CRON` | `0 * * * *` | Hourly schedule cron expression. |
| `GEMINI_API_KEY` | *(Optional)* | Optional LLM API key for agent narrative augmentation. |

> **Security Rule:** Never commit the `.env` file to version control. The repository's `.gitignore` explicitly blocks all `.env` files while allowing `.env.example`.

---

## 7. Data Pipeline

### Data Sources
1. **Pakistan Air Quality Initiative (PAQI) Sensor Network:**
   - **Publisher:** NASA ASDC DAAC (DOI: `10.5067/LOW-COST-SENSORS-AQ/PAKAIRQUALITY`).
   - **Coverage:** Hourly ground PM2.5 readings across 210 stations in Pakistan.
   - **Filtering:** Focused on Lahore (68 sensors) and Karachi (18 sensors).
2. **NASA POWER Meteorological Reanalysis:**
   - **Publisher:** NASA Langley Research Center POWER Project.
   - **Variables:** 2m Air Temp (`T2M`), Relative Humidity (`RH2M`), 10m Wind Speed (`WS10M`), 10m Wind Direction (`WD10M`), Surface Pressure (`PS`), Precipitation (`PRECTOTCORR`), Dew Point (`T2MDEW`).

### Processing Stages
```text
Raw ICARTT Wide Table -> DataCleaner (Reshape to Long Panel) -> GoldDatasetBuilder (Align Weather + 24h Target) -> Canonical Gold Parquet
```

### Gold Dataset Schema (`data/processed/gold_pm25_forecasting.parquet`)

| Column Name | Data Type | Units | Description |
| :--- | :--- | :--- | :--- |
| `record_id` | `VARCHAR(16)` | Hash string | Stable SHA-256 observation key: `SHA256(city_sensor_timestamp)[:16]`. |
| `timestamp_utc` | `TIMESTAMP` | ISO UTC | Observation timestamp at forecast issue time $t$. |
| `city` | `VARCHAR` | Categorical | Target city boundary (`Lahore` or `Karachi`). |
| `sensor_id` | `VARCHAR(16)` | Hex/Alphanumeric | Sensor station identifier. |
| `latitude` | `DOUBLE` | Degrees | Station latitude rounded to ~1 km for privacy. |
| `longitude` | `DOUBLE` | Degrees | Station longitude rounded to ~1 km for privacy. |
| `pm25` | `DOUBLE` | µg/m³ | Observed ground PM2.5 at issue time $t$. |
| `pm25_baseline_persistence` | `DOUBLE` | µg/m³ | Persistence baseline (Seasonal Naive $t$ for $t+24$). |
| `pm25_target_24h` | `DOUBLE` | µg/m³ | Ground observation at $t+24$ (**Supervised ML Target $y$**). |
| `T2M` | `DOUBLE` | °C | 2m Air Temperature. |
| `RH2M` | `DOUBLE` | % | 2m Relative Humidity. |
| `WS10M` | `DOUBLE` | m/s | 10m Wind Speed. |
| `WD10M` | `DOUBLE` | Degrees | 10m Wind Direction. |
| `PS` | `DOUBLE` | kPa | Surface Pressure. |
| `PRECTOTCORR` | `DOUBLE` | mm/hour | Precipitation. |
| `T2MDEW` | `DOUBLE` | °C | 2m Dew/Frost Point Temperature. |

---

## 8. ML Forecasting

### Model Specification
- **Algorithm:** `HistGradientBoostingRegressor` (Histogram-based Gradient Boosting).
- **Hyperparameters:** `max_iter=150`, `learning_rate=0.08`, `max_leaf_nodes=31`, `min_samples_leaf=20`, `l2_regularization=0.1`.
- **Target Transformation:** $\log(1 + y)$ transformation ensures strictly non-negative PM2.5 predictions.
- **Uncertainty Calibration:** Calibrated empirical quantile residuals compute 80% and 90% prediction intervals on validation residuals.

### Operational Serving Function
```python
from src.ml_pipeline.inference import predict_pm25_24h

predictions_df = predict_pm25_24h(
    sensor_history_df=df,
    model_path="artifacts/models/pm25_forecaster.joblib",
    coverage=0.80
)
```

### Performance vs. Declared Persistence Baseline

| Cohort / Metric | Model MAE | Baseline MAE | Improvement (%) | Model RMSE | Baseline RMSE |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Overall Test Set** | **24.50 µg/m³** | 31.80 µg/m³ | **+23.0%** | **36.10 µg/m³** | 45.20 µg/m³ |
| **Lahore Cohort** | **26.80 µg/m³** | 34.20 µg/m³ | **+21.6%** | **38.90 µg/m³** | 48.50 µg/m³ |
| **Karachi Cohort** | **17.50 µg/m³** | 24.60 µg/m³ | **+28.9%** | **24.30 µg/m³** | 31.40 µg/m³ |

- **80% Empirical Interval Coverage:** **80.2%** on held-out test data.
- **Average 80% Uncertainty Band Width:** **68.4 µg/m³**.

---

## 9. Agents

### 1. Data Quality Agent (`src/data_pipeline/validation/data_quality_agent.py`)
Deterministic decision policy engine enforcing 12 automated checks across incoming streams:
- `DQ-SCH-001`: Schema completeness (16 contract columns).
- `DQ-DUP-001`: Identifier uniqueness (`record_id`).
- `DQ-NULL-001`: Target missingness policy (**strictly FLAGGED**; never imputed).
- `DQ-FILL-001`: Covariate missingness (bounded backward `ffill` $\le 2\text{h}$).
- `DQ-RNG-001`: Physical range validation ($0.0 \le \text{PM}_{2.5} \le 1500.0\ \mu\text{g}/\text{m}^3$).
- `DQ-TMP-001`: Temporal continuity gaps ($>1\text{h}$ gap flagged).
- `DQ-FLT-001`: Sensor flatlining ($\ge 6\text{h}$ identical reading flagged).
- `DQ-DST-001`: Extreme episodic spike detection ($>800\ \mu\text{g}/\text{m}^3$ flagged).

### 2. Insight / RAG Agent (`src/insight_agent/interface.py`)
Clean high-level interface for dashboards, chat bots, and decision-support systems:
```python
from src.insight_agent.interface import answer_question

res = answer_question("What is tomorrow's PM2.5 forecast for Lahore?")
print(res["answer"])
```

**Anti-Hallucination Guard:**
1. Every numeric claim in the response must match an exact evidence value in the `EvidenceBundle`.
2. Unsupported queries (e.g. asking for Peshawar, Islamabad, or non-air-quality questions) immediately trigger a deterministic, polite **"I don't know"**.

---

## 10. Running Locally

### Run the Data Pipeline CLI
```bash
# Run Data Quality Agent audit
python -m src.data_pipeline.cli quality-agent
```

### Run ML Inference
```bash
python -m src.ml_pipeline.cli run
```

### Launch the Interactive Streamlit Dashboard
```bash
streamlit run src/dashboard/app.py
```
*Or via the root application entrypoint:*
```bash
streamlit run app.py
```

### Execute the Orchestration Pipeline Once
```bash
python -m src.orchestration.scheduler run-once
```

---

## 11. Prefect Scheduling

The production pipeline is orchestrated with **Prefect 3.8**:
- **Flow Name:** `pm25-hourly-pipeline`
- **Schedule:** `Cron("0 * * * *", timezone="Asia/Karachi")`
- **Timezone:** Asia/Karachi (Pakistan Standard Time, UTC+5)
- **Work Pool:** `pm25-work-pool`

### Starting the Local Runner Daemon
```bash
python -m src.orchestration.scheduler start-worker --interval 3600
```

### Inspect Pipeline Status & Data Freshness
```bash
python -m src.orchestration.scheduler status
```

### Failure Handling & Non-Destructive Publishing
- **Atomic File Swaps:** Published outputs (`latest_forecast.json` and `latest_quality.json`) are written via temporary staging files and atomic file renames.
- **Corrupt Run Protection:** If an upstream data outage or API timeout occurs, the error is logged to `outputs/run_history/run_history.json`, but the **last valid published forecast is strictly preserved**.
- **Concurrency Locking:** A file-based lock (`.pipeline.lock`) prevents duplicate or overlapping worker runs from interleaving writes.

---

## 12. Dashboard

The Streamlit dashboard (`src/dashboard/app.py`) provides five dedicated views:
1. **📈 24h Forecast & Live Trends:** Current PM2.5, 24-hour ahead prediction, calibrated 80% prediction interval, persistence baseline comparison, and interactive Altair time-series chart with regulatory threshold overlays.
2. **🤖 Decision-Support Insight Agent:** Interactive grounded chat interface with quick suggestion chips, evidence bundle inspection, citation tracking, and anti-hallucination verification badges.
3. **🛡️ Data Quality Governance:** System certification status (PASS/WARN), anomaly actions summary table (`NO_ACTION`, `FLAG`, `FILL`, `FIX`), and active quality warnings.
4. **📊 Model Performance & Metrics:** Test set error metrics (MAE, RMSE, baseline improvement %), city breakdown tables, and embedded evaluation diagnostic charts.
5. **⚙️ Prefect Orchestration & Health:** Live deployment status, data freshness counter, interactive manual pipeline trigger, and chronological execution history log.

---

## 13. Hugging Face Space Deployment

### Space Configuration
- **Platform:** Hugging Face Spaces
- **SDK:** `streamlit` (v1.42.0+)
- **Entrypoint:** `app.py`
- **Required Secrets:** `GEMINI_API_KEY` (optional), `PREFECT_API_URL` (optional)
- **Included Assets:** `artifacts/models/pm25_forecaster.joblib`, `artifacts/predictions/test_predictions.csv`, `artifacts/reports/metrics_summary.json`.

### Steps to Deploy to Hugging Face Space:
1. Create a new Space on [Hugging Face](https://huggingface.co/new-space) selecting **Streamlit** as SDK.
2. Connect your repository or push repository files.
3. In Space **Settings** -> **Variables and Secrets**, add any required API keys.
4. The Space automatically detects `requirements.txt` and launches `app.py`.

---

## 14. Testing

The repository features comprehensive test coverage across unit, contract, and end-to-end integration tiers.

### Run All 55 Unit & Contract Tests
```bash
python -m pytest tests/unit tests/contract -v
```

### Run the Master Acceptance Matrix (All 29 Criteria D-01 to H-04)
```bash
python -m pytest tests/integration/test_master_acceptance_suite.py -v
```

### Acceptance Matrix Summary:
- **Data Pipeline (D-01 to D-05):** Verified schema completeness, non-fabrication missingness policy, error isolation, freshness reporting, and deterministic reproducibility.
- **ML Inference (M-01 to M-05):** Verified valid inference, empty history exceptions, horizon/units conformity, uncertainty bounds contract, and missing model fallback.
- **Agents (A-01 to A-05):** Verified numerical grounding, statutory citation attribution, "I don't know" boundary handling, and quality warning disclosure.
- **Prefect Orchestration (P-01 to P-06):** Verified manual flow execution, hourly cron configuration, run history logging, retry behavior, concurrency lock, and failed-run preservation.
- **Dashboard & Deployment (U-01 to H-04):** Verified UI data rendering, station selection, error states, secret concealment, entrypoint health, and restart recovery.

---

## 15. Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `InconsistentVersionWarning` on model load | Artifact saved in scikit-learn 1.6 vs running on 1.9 | Safe warning; estimator structure and binning remain 100% compatible. |
| `RuntimeError: Active lock detected` | Prior run exited abruptly leaving `.pipeline.lock` | Remove `outputs/run_history/.pipeline.lock` (stale locks >30 min are auto-cleared). |
| `City 'X' is not currently supported` | Queried city is outside Lahore and Karachi | System intentionally rejects unsupported cities to prevent spatial hallucinations. |
| Port 8501 already in use | Previous Streamlit instance running | Run `streamlit run app.py --server.port 8502`. |
| Streamlit Altair schema error | Incompatible pandas datetime index | Pipeline explicitly standardizes UTC timestamps via `pd.to_datetime(..., utc=True)`. |

---

## 16. Responsible AI and Limitations

1. **Optical Low-Cost Sensor Characteristics:** Optical particle counters (like those in PAQI monitors) are subject to hygroscopic particle growth in relative humidity exceeding 80–85%. While the Data Quality Agent flags extreme single-hour spikes ($>800\ \mu\text{g}/\text{m}^3$), readings reflect field conditions.
2. **Missing Value Policy:** The system enforces strict non-fabrication. Gaps in air-quality sensor data are preserved and flagged with `FLAG`; target readings are **never synthesized**.
3. **Forecast Horizon & Stagnation:** The 24-hour ahead model ($t+24$) captures meteorological diurnal cycles and historical persistence. Extreme sudden local events (e.g. crop-residue fire plumes) may deviate until plume signals appear in ground lags.
4. **Authoritative Citations:** Citations are restricted to recognized statutory documents:
   - *Government of Punjab Smog Prevention and Control Policy (2023)*
   - *Pakistan Environmental Protection Agency NEQS (S.R.O. 1062(I)/2010)*
   - *World Health Organization Air Quality Guidelines (2021)*

---

## 17. Reproducibility

Every stage of the Pakistan PM2.5 pipeline is deterministic and version-controlled:
1. **Raw Artifact Hashes:** Recorded in `data/manifests/manifest.csv` with SHA-256 digests.
2. **Deterministic Train/Test Splits:** Chronological buffer splitting prevents any lookahead leakage.
3. **Model Weights:** Pinned in `artifacts/models/pm25_forecaster.joblib`.
4. **Execution Audit:** All hourly runs log run IDs, durations, and output locations to `outputs/run_history/run_history.json`.

---

## 18. License and Attribution

This project is licensed under the **MIT License**.

### Attribution & Acknowledgments
- **Pakistan Air Quality Initiative (PAQI):** Ground-level low-cost sensor network data curated by Abid Omar.
- **NASA Langley Atmospheric Science Data Center (ASDC) DAAC:** Hosting of the PAQI dataset (DOI: [10.5067/LOW-COST-SENSORS-AQ/PAKAIRQUALITY](https://doi.org/10.5067/LOW-COST-SENSORS-AQ/PAKAIRQUALITY)).
- **NASA POWER Project:** Hourly meteorological reanalysis data from NASA Langley Research Center.
- **Punjab Environmental Protection Department (EPD):** Regulatory standards and Clean Air Action Plan benchmarks.
