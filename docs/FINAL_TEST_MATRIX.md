# FINAL TEST MATRIX: AUTOMATED & REGRESSION COVERAGE
**Project:** Pakistan PM2.5 Hourly Forecasting & Insight Platform (HackInsight 2026)  
**Auditor:** Autonomous Release Owner & Senior QA Engineer  
**Execution Environment:** Python 3.12.10 (Windows x86_64), Node.js v24.20.0  
**Test Framework:** Pytest 9.1.1  
**Total Automated Tests:** 84 | **Passed:** 84 | **Failed:** 0 | **Pass Rate:** 100.0%

---

## 1. Master Acceptance Suite (`tests/integration/test_master_acceptance_suite.py`)

| Test ID | Test Name | Target Component | Acceptance Criteria | Execution Result |
|---|---|---|---|---|
| **D-01** | `test_D01_valid_dataset_schema` | Data Pipeline | Schema contains all 16 required contract columns, valid cities (Lahore, Karachi) | **PASS** (0.42s) |
| **D-02** | `test_D02_missing_values_policy` | Data Quality | Target missingness is FLAGGED; covariate missingness is bounded FILLED | **PASS** (0.15s) |
| **D-03** | `test_D03_source_unavailable_error` | Pipeline Ingestion | Missing source triggers graceful FAILED status without publishing corrupt artifacts | **PASS** (1.85s) |
| **D-04** | `test_D04_stale_source_freshness_reporting`| Pipeline Metadata | Stale data (>24h) emits alert in output manifest | **PASS** (0.02s) |
| **D-05** | `test_D05_pipeline_reproducibility` | Clean Re-run | Successive runs with identical inputs produce deterministic artifacts | **PASS** (0.03s) |
| **M-01** | `test_M01_valid_history_inference` | ML Inference | Inference returns valid 24h predictions with non-empty intervals | **PASS** (0.18s) |
| **M-02** | `test_M02_insufficient_history_fallback`| ML Inference | History < 24h falls back cleanly to baseline without crashing | **PASS** (0.01s) |
| **M-03** | `test_M03_timestamp_and_units` | ML Forecast Contract | Target timestamp is exactly issue_time + 24h; units are ug/m3 | **PASS** (0.01s) |
| **M-04** | `test_M04_intervals_and_baseline_contract`| ML Forecasting | 80% intervals satisfy lower <= pred <= upper; baseline persistence included | **PASS** (0.02s) |
| **M-05** | `test_M05_model_unavailable_degraded_state`| ML Inference | Missing model artifact degrades cleanly to baseline persistence | **PASS** (0.01s) |
| **A-01** | `test_A01_numerical_grounding` | Insight Agent | Agent responses contain exact numerical figures verified against gold dataset | **PASS** (0.35s) |
| **A-02** | `test_A02_evidence_citation` | RAG Grounding | Guidance responses cite authoritative standards (Pak-EPA, WHO) | **PASS** (0.28s) |
| **A-03** | `test_A03_unsupported_question_handling`| Insight Agent | Out-of-scope questions are politely declined without hallucinations | **PASS** (0.12s) |
| **A-04** | `test_A04_api_failure_handling` | Agent Tooling | Sensor API errors handled gracefully with user-facing diagnostic note | **PASS** (0.09s) |
| **A-05** | `test_A05_data_quality_warning` | Insight Agent | Data quality issues surface warnings alongside analytical summaries | **PASS** (0.25s) |
| **P-01** | `test_P01_manual_flow_execution` | Prefect Orchestration| Flow executes successfully, returning run metadata and positive duration | **PASS** (14.2s) |
| **P-02** | `test_P02_hourly_schedule_configuration`| Prefect Scheduler | Configured for cron `0 * * * *` with timezone `Asia/Karachi` | **PASS** (0.01s) |
| **P-03** | `test_P03_run_history_visibility` | Orchestration Audit | Status, timestamps, and step records logged to `outputs/run_history` | **PASS** (0.02s) |
| **P-04** | `test_P04_retry_behavior` | Orchestration Task | Sensor acquisition task configured with 3 retries and 5s exponential backoff | **PASS** (0.01s) |
| **P-05** | `test_P05_concurrent_runs_protection`| Concurrency Control | File lock prevents overlapping runs from writing concurrently | **PASS** (0.05s) |
| **P-06** | `test_P06_failed_run_preserves_valid_output`| Output Atomic Write| Failure does not overwrite or delete previous valid forecast JSON | **PASS** (0.04s) |
| **U-01** | `test_U01_normal_dashboard_data_loading`| Dashboard Engine | Dashboard backend parses valid forecast outputs and metadata | **PASS** (0.04s) |
| **U-02** | `test_U02_city_sensor_selection` | Dashboard Filters | Filtering by city (Lahore/Karachi) and sensor subsets operates cleanly | **PASS** (0.02s) |
| **U-03** | `test_U03_prediction_interval_visualization`| Dashboard Charts| Upper and lower bounds are available for confidence band rendering | **PASS** (0.01s) |
| **U-04** | `test_U04_model_metric_card_display` | Dashboard Metrics | MAE, RMSE, and baseline comparisons are accurately populated | **PASS** (0.02s) |
| **U-05** | `test_U05_data_quality_indicator` | Dashboard Status | Data quality badge displays current system health status | **PASS** (0.01s) |
| **U-06** | `test_U06_agent_chat_integration` | Dashboard Agent | Chat interface successfully queries Insight Agent and returns grounded text | **PASS** (0.22s) |
| **U-07** | `test_U07_stale_data_warning_banner` | Dashboard Alerts | Stale data flag generates warning banner for end users | **PASS** (0.02s) |
| **U-08** | `test_U08_degraded_state_banner` | Dashboard Alerts | Model degradation activates fallback notice | **PASS** (0.01s) |

---

## 2. Unit Test Matrix (`tests/unit`)

| Module | Test Count | Key Invariants Tested | Status |
|---|---|---|---|
| `test_current_pm25.py` | 4 | Real-time observation extraction, sensor lookup, city isolation | **PASS** |
| `test_data_quality_agent.py`| 10 | Schema checks, deterministic fix, duplicate resolution, impossible value flagging, flatlines, audit trail | **PASS** |
| `test_forecast_tool.py` | 3 | City forecast retrieval, invalid city rejection, payload structure | **PASS** |
| `test_historical_pm25.py` | 3 | Historical window filtering, chronological ordering, sensor bounds | **PASS** |
| `test_insight_agent.py` | 9 | Multi-tool orchestration, statutory citations, out-of-scope boundaries, audit logging | **PASS** |
| `test_manifest.py` | 3 | SHA-256 artifact checksum verification, tamper detection | **PASS** |
| `test_ml_inference.py` | 7 | Disk artifact loading, forecast horizon = 24h, zero future lookahead, missing columns handling | **PASS** |
| `test_ml_pipeline.py` | 6 | Chronological splits, test set quarantine, tier-boost sample weighting, metric recomputation | **PASS** |
| `test_model_metrics.py` | 4 | Overall metrics retrieval, city-level drilldown (Lahore, Karachi) | **PASS** |
| `test_quality_tool.py` | 3 | Overall quality status, rule ID query, missing rule error | **PASS** |

---

## 3. Contract Test Matrix (`tests/contract`)

| Module | Test Count | Key Invariants Tested | Status |
|---|---|---|---|
| `test_pipeline_contracts.py`| 3 | DataCleaner output schema, GoldBuilder parquet spec, Validator schema invariants | **PASS** |

---

## 4. Web Application Test Matrix (`web/`)

| Test Area | Verification Method | Status |
|---|---|---|
| TypeScript Compilation | `npm run build` (tsc + vite) | **PASS** (Zero errors) |
| 3D WebGL Globe | Three.js Canvas mounting and interactive drag rotation | **PASS** |
| Real-time Filter State | Lahore / Karachi sensor switching and 24h forecast curve update | **PASS** |
| Production Deployment | Vercel Edge CDN (`https://web-rho-orcin-41.vercel.app`) | **PASS** (HTTP 200) |
