# 📦 HACKINSIGHT 2026: SUBMISSION DELIVERABLES DOSSIER

**Team:** DataMinors  
**Members:** Laiba Akram, Ali Hasan Farooqui, Areeba, Bushra Abid  
**Track:** Air Quality (Lahore & Karachi PM2.5 24h Hourly Forecasting)  
**Repository:** [Ali-HF/HackInsight](https://github.com/Ali-HF/HackInsight)  
**Release Tag:** [`v1.0-final`](https://github.com/Ali-HF/HackInsight/tree/v1.0-final)  
**Live Citizen Dashboard:** [https://web-livid-eight-rcllafnbqq.vercel.app](https://web-livid-eight-rcllafnbqq.vercel.app)  
**Hugging Face Telemetry Space:** [huggingface-space/](file:///c:/HIS/huggingface-space/)  

---

## 📂 Deliverables Index in this Directory

This directory aggregates every mandatory deliverable, audit report, and trained model artifact for review:

### 1. Core Submission Documents
| File | Description | Hackathon Requirement |
|---|---|---|
| [`Summary.pdf`](Summary.pdf) | **Executive Summary (Verified Exactly 1 Page):** Approach, data provenance, scientific ML rigor, anti-hallucination agent, and quantified Pakistan public health impact. | **Requirement 9 & 10** |
| [`datasetproposal.pdf`](datasetproposal.pdf) | **Dataset Proposal & Credible Resources Dossier:** Full justification of PAQI NASA ASDC DAAC (DOI: `10.5067/LOW-COST-SENSORS-AQ/PAKAIRQUALITY`, off-track source), NASA POWER reanalysis, OpenAQ v3 delta feed, and statutory regulatory standards. *(Also available as `datasetpropsal.pdf`)*. | **Requirement 6** |
| [`AI_Use_Log.md`](AI_Use_Log.md) | **Material AI Use Disclosures:** Detailed matrix of AI coding tools, tasks assisted, human manual verification, and member attribution in compliance with Section 12. | **Requirement 11** |
| [`SUBMISSION_DEFENSE_AND_BUSINESS_MODEL.md`](SUBMISSION_DEFENSE_AND_BUSINESS_MODEL.md) | **Comprehensive Defense Dossier:** Includes: <br>1. **Business Model:** User, Payer, Value proposition (PKR 45M saved/season), and Running Cost ($15–$35/mo).<br>2. **Optimization Log:** 7-phase step-by-step impact on accuracy, speed, and memory.<br>3. **Physical Viva Guide:** Member-by-member defense matrix and expected Q&A.<br>4. **3-Minute Demo Video Script:** Time-coded walkthrough (0:00–3:00, no login needed). | **Requirements 10, 12, 14, 15** |
| [`HACKATHON_GUIDE_COMPLIANCE_AUDIT.md`](HACKATHON_GUIDE_COMPLIANCE_AUDIT.md) | **Compliance Audit Matrix:** Line-by-line audit verifying 100% adherence to all chapters and scoring criteria of `HACKATHON_GUIDE.md`. | **Audit & Governance** |

---

### 2. Pipeline, Reproducibility & Data Quality
| File / Path | Description |
|---|---|
| [`Makefile`](Makefile) | Automated pipeline execution entrypoint. Run `make data` to reproduce the entire warehouse from scratch, or `make test` for the complete test suite. |
| [`manifest.csv`](manifest.csv) | Cryptographic data manifest registering raw sources with SHA-256 hashes, file sizes, UTC fetch timestamps, and open licenses. |
| [`reports/quality_log.csv`](reports/quality_log.csv) | Data Quality Agent decision log recording `FIX`, `FILL` (bounded max 2h cap on weather only), `FLAG` (sensor flatlines $\ge 6h$ and extreme values $>800\ \mu\text{g}/\text{m}^3$), and `NO_ACTION`. Target PM2.5 is **never** fabricated. |
| [`prefect_runs.csv`](prefect_runs.csv) | Operational execution history for the hourly Prefect 3.0 flow (`0 * * * *` `Asia/Karachi`), logging task durations, state, and retry handling. |

---

### 3. Machine Learning Evaluation & Artifacts
| File / Path | Description |
|---|---|
| [`reports/metrics_summary.json`](reports/metrics_summary.json) | Complete evaluation metrics proving the model **beats the Seasonal Persistence Baseline**: <br>• Test MAE: **40.81** vs Baseline **42.35** (**+3.63% gain**)<br>• Test RMSE: **69.63** vs Baseline **73.90** (**+5.79% gain**)<br>• Validation MAE: **23.76** vs Baseline **27.68** (**+14.17% gain**)<br>• Conformal 80% Uncertainty: **82.42%** empirical test coverage. |
| [`reports/error_analysis.json`](reports/error_analysis.json) | Granular error breakdowns demonstrating sub-group fairness across cities (Karachi +3.79%, Lahore +3.62%), seasons (DJF Winter Smog +4.22%, JJA Monsoon +17.07%), and unseen sensor stations (+4.15%). |
| [`models/pm25_forecaster.joblib`](models/pm25_forecaster.joblib) | Serialized `HistGradientBoostingRegressor` model artifact (1.8 MB, <100MB RAM runtime, sub-50ms inference latency). |

---

## ⚡ Quick Start & Reproduction

From the repository root:
```bash
# 1. Reproduce the full data acquisition, cleaning, and gold warehouse:
make data

# 2. Run all 101 automated unit, contract, and integration tests:
make test

# 3. Launch local decision-support dashboard:
make run
```
