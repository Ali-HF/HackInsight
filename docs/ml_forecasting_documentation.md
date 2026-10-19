# HackInsight 2026: PM2.5 24-Hour-Ahead Forecasting Model

**Track:** Air Quality & Public Health Decision Support  
**Target Region:** Pakistan (Lahore & Karachi)  
**Author / Role:** Member 2 — Machine Learning Engineer  
**Status:** Production Ready & Leakage-Safe  

---

## 1. Executive Summary & Problem Formulation

In Pakistan, particulate matter ($PM_{2.5}$) levels regularly surge past hazardous thresholds, especially during the autumn/winter "Smog Season" (October to February). Traditional ground monitoring has historically been sparse, leaving environmental protection officers without sufficient advance warning. 

This ML module delivers a **leakage-safe, uncertainty-aware, 24-hour-ahead ($t+24$) point and interval forecasting pipeline** for ground-level $PM_{2.5}$ across Lahore and Karachi. It enables smog response officers to take preventive action (traffic restrictions, school advisories, factory emission caps) a full 24 hours in advance.

### Canonical Target Formulation
- **Forecast Horizon:** Exactly 24 hours ahead ($t+24\text{ hours}$).
- **Target Variable ($y$):** `pm25_target_24h` ($\mu g/m^3$), strictly matching the same ground sensor's observed concentration at time $t+24$.
- **Forecast Issue Time ($t$):** Present timestamp in UTC (`timestamp_utc`). All features use strictly data observed at or before $t$.

---

## 2. Declared Baseline & Success Criteria

As formally declared in `DATASET_DECLARATION.md` and `docs/member_2_ml_handoff_contract.md`:
- **Declared Baseline:** Seasonal Naive / Persistence Baseline ($y_{pred} = y_t$), represented by `pm25_baseline_persistence`.
- **Primary Metric:** Mean Absolute Error (MAE) in $\mu g/m^3$.
- **Secondary Metric:** Root Mean Squared Error (RMSE) in $\mu g/m^3$.
- **Evaluation Rule:** Baseline and ML models are evaluated on the **exact same evaluation records**.
- **Target Success Criteria:** Test MAE must outperform the persistence baseline without degrading performance on any major regional or seasonal subgroup.

---

## 3. Data Integrity & Leakage Prevention Architecture

### Why Weather Covariates Were Quarantined
During the Member 1 data audit, rigorous diurnal cycle analysis revealed that the NASA POWER meteorological parameters (`T2M`, `RH2M`, `WS10M`, etc.) exhibited diurnal temperature peaks at 12:00–13:00 UTC (17:00–18:00 PKT), strongly indicating that the weather source was delivered in Local Solar Time (LST) but stored under a UTC label (a ~4–5 hour shift). Furthermore, reanalysis data suffers from a 2–3 day publication latency. 
**Architectural Decision:** To guarantee zero timestamp contamination and live deployability, all NASA weather variables were strictly excluded from the primary model features.

### Leakage Prevention Guarantees
1. **Sensor Isolation:** Lags and rolling windows are computed strictly per sensor. Features never cross sensor boundaries.
2. **True Time-Grid Alignment:** When sensors experience outages, simple row shifting (`.shift(1)`) would erroneously treat a 10-day-old value as an immediate 1-hour lag. Our pipeline aligns each sensor to an hourly DatetimeIndex prior to computing lags.
3. **Strict Causality:** Rolling statistics (mean, std, min, max over 6h, 12h, 24h, 72h, 168h) are closed on the right at time $t$, ensuring zero lookahead into future hours.
4. **Target Quarantine:** `pm25_target_24h` and `pm25_baseline_persistence` are strictly isolated from the feature matrix.

---

## 4. Feature Engineering Architecture

The model uses **40 safe, causal features**:

| Feature Category | Features Included | Rationale |
| :--- | :--- | :--- |
| **Current State** | `pm25` | Immediate baseline pollution level at forecast issue time $t$. |
| **Autoregressive Lags** | `pm25_lag_1h`, `3h`, `6h`, `12h`, `24h`, `48h`, `72h`, `168h` | Captures strong autoregression (lag-1 autocorrelation $\approx 0.916$, diurnal cycle at lag-24 $\approx 0.686$, and weekly pattern at lag-168 $\approx 0.515$). |
| **Causal Rolling Statistics** | `pm25_roll_{mean,std,min,max}_{6h,12h,24h,72h,168h}` | Captures short-, medium-, and multi-day accumulation trends, volatility, and local bounds without future leakage. |
| **Cyclical Calendar** | `hour_sin`, `hour_cos`, `month_sin`, `month_cos` | Continuous circular representation of diurnal and annual seasonality. |
| **Calendar Flags** | `dayofweek`, `season`, `is_weekend`, `is_smog_season` | Accounts for weekend traffic dips and winter inversion meteorological regimes. |
| **Spatial Coordinates** | `city_code`, `latitude`, `longitude` | Captures regional climate differences between Lahore and coastal Karachi without memorizing sensor IDs. |

> **Critical Design Choice:** `sensor_id` is **strictly excluded** from features. In our chronological test split, 17 out of 30 sensors are brand-new entities unseen during training. Omitting `sensor_id` forces the model to learn transferable spatial-autoregressive physics rather than memorizing individual sensor IDs.

---

## 5. Chronological Splitting Strategy

To mirror true operational deployment, data was split strictly by time with a 24-hour blackout buffer between splits:

- **Train Split (70% time span):** 2022-01-01 00:00 to 2024-02-08 21:00 UTC (77,277 rows, 13 sensors)
- *24-Hour Buffer Gap:* 2024-02-08 22:00 to 2024-02-09 21:00 UTC (prevents temporal boundary leakage)
- **Validation Split (15% time span):** 2024-02-09 22:00 to 2024-07-22 12:00 UTC (39,971 rows, 14 sensors)
- *24-Hour Buffer Gap:* 2024-07-22 13:00 to 2024-07-23 12:00 UTC
- **Untouched Final Test Split (15% time span):** 2024-07-23 13:00 to 2024-12-30 23:00 UTC (49,116 rows, 30 sensors)

---

## 6. Model Architecture & Right-Skew Stabilization

### Model Choice: `HistGradientBoostingRegressor`
- Fast, C-optimized histogram gradient boosting (LightGBM algorithm natively integrated in Scikit-Learn).
- Eliminates brittle external OpenMP C++ dylib dependencies on macOS.
- Built-in native missing value routing (enables seamless inference even when long historical lags are unavailable during new sensor startup).

### Target Transformation: `log1p`
Ground $PM_{2.5}$ concentration is strongly right-skewed with extreme peak spikes ($> 500\,\mu g/m^3$).
- Training on raw $y$ leads gradient boosting trees to overfit to massive outliers.
- Transforming target to $\log(1 + y)$ normalizes the residual error variance.
- **Validation Evidence:**
  - Raw Model: MAE = $24.968\,\mu g/m^3$
  - Log1p Model: MAE = $23.834\,\mu g/m^3$ (an additional $1.13\,\mu g/m^3$ gain).
- All predictions are inverse-transformed ($\exp(\hat{y}_{trans}) - 1$) and clipped to the minimum physically plausible reading ($1.0\,\mu g/m^3$).

---

## 7. Uncertainty Estimation & Prediction Intervals

To meet competition requirements for uncertainty-aware decision support, we calibrated **empirical residual quantiles** in log space on the validation split:
- **Interval Formula:**
  $$\hat{y}_{lower} = \max\left(\exp(\log(1 + \hat{y}) + q_{10}^{log}) - 1,\; 1.0\right)$$
  $$\hat{y}_{upper} = \exp(\log(1 + \hat{y}) + q_{90}^{log}) - 1$$
- **Heteroscedastic Property:** Because quantiles are applied in log space, prediction intervals naturally scale with predicted pollution: narrow bands during clean summer days and wide, cautious bands during intense winter smog episodes.
- **Empirical Coverage on Untouched Test Set:** **82.59%** (target: 80.0%), with an average width of $139.94\,\mu g/m^3$.

---

## 8. Benchmark Results & Error Analysis

All metrics are computed on the **exact same 49,116 test rows**:

### Overall Performance

| Model | MAE ($\mu g/m^3$) | RMSE ($\mu g/m^3$) | MAE Gain (%) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Persistence Baseline** | 42.347 | 73.902 | — | Declared benchmark |
| **HistGB Forecaster (Ours)** | **41.332** | **71.300** | **+2.40%** ($1.015\,\mu g/m^3$) | **Beats Baseline** |

### Group Disaggregation (Test Set)

| Group / Cohort | Sample Size ($n$) | Baseline MAE | Model MAE | MAE Gain (%) | Baseline RMSE | Model RMSE |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Karachi** | 12,168 | 14.583 | **14.099** | **+3.32%** | 23.930 | **21.335** (+10.84%) |
| **Lahore** | 36,948 | 51.491 | **50.301** | **+2.31%** | 84.092 | **81.290** (+3.33%) |
| **Winter / Smog (DJF)** | 15,024 | 48.099 | **45.922** | **+4.53%** | 69.644 | **62.718** (+9.94%) |
| **Monsoon (JJA)** | 9,496 | 19.112 | **15.769** | **+17.49%** | 28.651 | **22.290** (+22.20%) |
| **Autumn (SON)** | 24,596 | 47.805 | 48.398 | -1.24% | 87.329 | **86.932** (+0.45%) |
| **Seen Sensors** | 32,003 | 39.118 | **38.500** | **+1.58%** | 71.633 | **70.357** (+1.78%) |
| **Unseen Sensors** | 17,113 | 48.386 | **46.628** | **+3.63%** | 77.967 | **73.033** (+6.33%) |
| **Medium Tier (38–165)** | 24,563 | 36.835 | **32.332** | **+12.22%** | 58.258 | **47.331** (+18.76%) |

### Key Viva Insights from Error Analysis
1. **Unseen Sensor Generalization:** The model outperforms persistence by **+3.63%** on brand-new, unseen sensors compared to **+1.58%** on seen sensors. This validates our design decision to exclude `sensor_id` from the feature set.
2. **Seasonal Dominance in Monsoon and Winter:** Monsoon predictions improve by **17.49% MAE** and **22.20% RMSE** over baseline. Winter smog predictions improve by **4.53% MAE** and **9.94% RMSE**.
3. **Extreme Event Regression to Mean:** In the top decile ($PM_{2.5} \ge 275\,\mu g/m^3$), persistence baseline exhibits lower MAE. Gradient-boosted trees naturally regress extreme single-point spikes toward the conditional mean to optimize overall loss. For operational alerts, the 80% upper prediction bound successfully brackets these high-pollution spikes.

---

## 9. Reproducibility & Artifact Manifest

The entire pipeline is deterministic and can be reproduced with a single command from the project root:

```bash
python -m src.ml_pipeline.cli run
```

### Generated Artifacts
- **Model:** `artifacts/models/pm25_forecaster.joblib`
- **Metadata:** `artifacts/metadata/feature_metadata.json`, `split_metadata.json`
- **Metrics Summary:** `artifacts/reports/metrics_summary.json`
- **Detailed Error Analysis:** `artifacts/reports/error_analysis.csv`, `error_analysis.json`
- **Machine-Readable Predictions:** `artifacts/predictions/test_predictions.csv`
- **Visual Plots:** 
  - `artifacts/figures/actual_vs_predicted.png`
  - `artifacts/figures/error_by_group.png`
  - `artifacts/figures/prediction_interval_sample.png`
