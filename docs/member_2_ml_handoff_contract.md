# Member 1 to Member 2 Data Handoff Contract
## Project: PM2.5 Air-Quality Forecasting in Pakistan (HackInsight 2026)

---

### 1. Delivery Summary
Member 1 (Data Engineering) provides the canonical, leakage-safe Gold dataset to Member 2 (Machine Learning).

- **Gold Dataset Location:** `data/processed/gold_pm25_forecasting.parquet`
- **Warehouse Storage Engine:** DuckDB / Parquet
- **Target Time Horizon:** 24 hours ahead ($t+24$)
- **Canonical Timezone:** UTC (`timestamp_utc`)
- **Native Spatial Resolution:** Ground sensor level (`sensor_id`) aggregated to city centroids (`city`)

---

### 2. Schema Specification

| Column Name | Data Type | Units / Range | Description |
| :--- | :--- | :--- | :--- |
| `record_id` | `VARCHAR(16)` | Hex hash string | Unique stable observation key: SHA-256(`city_sensor_timestamp`)[:16] |
| `timestamp_utc` | `TIMESTAMP` | ISO 8601 UTC | Timestamp of feature observation ($t$) |
| `city` | `VARCHAR` | `Lahore`, `Karachi` | Geographic city boundary |
| `sensor_id` | `VARCHAR(16)` | Hexadecimal | IQAir AirVisual sensor identifier (Header Line 21 mapping) |
| `latitude` | `DOUBLE` | Decimal degrees | Sensor latitude (rounded to ~1 km for privacy) |
| `longitude` | `DOUBLE` | Decimal degrees | Sensor longitude (rounded to ~1 km for privacy) |
| `pm25` | `DOUBLE` | $\mu g/m^3$ | Observed PM2.5 concentration at forecast issue time $t$ |
| `pm25_baseline_persistence` | `DOUBLE` | $\mu g/m^3$ | Baseline prediction: PM2.5 at time $t$ for target $t+24$ (Seasonal Naive) |
| `pm25_target_24h` | `DOUBLE` | $\mu g/m^3$ | Observed PM2.5 at time $t+24$ (**Target Variable $y$**) |
| `T2M` | `DOUBLE` | °C | 2m Air Temperature from NASA POWER / Open-Meteo |
| `RH2M` | `DOUBLE` | % | 2m Relative Humidity |
| `WS10M` | `DOUBLE` | m/s | 10m Wind Speed |
| `WD10M` | `DOUBLE` | degrees | 10m Wind Direction |
| `PS` | `DOUBLE` | kPa | Surface Pressure |
| `PRECTOTCORR` | `DOUBLE` | mm/hour | Precipitation |
| `T2MDEW` | `DOUBLE` | °C | 2m Dew/Frost Point Temperature |

---

### 3. Critical Rules for Member 2 (ML)

1. **Chronological Train/Test Split (No Random Splitting):**
   - Split strictly by time: Train on earlier periods, validate on intermediate periods, test on the latest period.
   - Do **NOT** use random k-fold cross-validation across time steps (violates temporal independence).
2. **Untouched Test Set:**
   - Keep the final test split completely untouched until final evaluation.
   - Fit all scalers, encoders, and feature transformers on the training split only.
3. **Declared Baseline to Beat:**
   - Model must beat `pm25_baseline_persistence` on test set MAE (declared in `DATASET_DECLARATION.md`).
4. **Group Error Reporting:**
   - In addition to overall test MAE and RMSE, report performance tables broken down by:
     - City (`Lahore` vs. `Karachi`)
     - Season (e.g., Smog Season [Oct–Feb] vs. Summer/Monsoon [Mar–Sep])
5. **Uncertainty Output:**
   - Member 2 must output prediction intervals (e.g., 10th and 90th percentiles or conformal prediction range) alongside point forecasts.
