# Data Inventory Report
## Project: PM2.5 Air-Quality Forecasting in Pakistan (HackInsight 2026)

**Inventory Date:** 2026-10-19  
**Workspace:** `c:\HIS`

---

### 1. Raw Files Inventory

| Relative Path | Size | SHA-256 Checksum | Format | Source ID | Preservation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Low-Cost-Sensors-AQ_PakAirQuality_1-20261019_052227/Low-Cost-Sensors-AQ_PAQI_PM25_20161007_thru_20260331.ict` | 181,909,140 bytes (~173.48 MB) | `892dc29a5d38af1e9f7a89996592faad0b2d93cb66bf3ebf72406d748819fe13` | ICARTT (ASCII text) | `SRC-PAQI-PM25` | **Preserved / Read-Only** (Unmodified source file) |

---

### 2. PAQI Dataset Structural Metrics

- **Total Rows:** `79,645`
- **Total Columns:** `211` (`1` datetime in UTC + `210` IQAir AirVisual hex-hash sensor channels)
- **Time Bounds:** `2016-10-07 12:00:00 UTC` to `2026-03-31 19:00:00 UTC`
- **Target Variable:** Hourly PM2.5 ($\mu g/m^3$)
- **Missing Value Sentinel:** `-9999`
- **Sensor Locations:** Embedded in Header Line 21 (`DEVICE LOCATIONS: <id> (lat, lon)`)

#### Breakdown by Geographic Target:
- **Karachi:** 18 active sensors, `143,382` non-missing PM2.5 readings.
- **Lahore:** 68 active sensors, `479,145` non-missing PM2.5 readings.
- **Overlap Hours:** `32,397` distinct hours contain at least one valid reading from both Lahore and Karachi (~3.7 years).
- **Rule Verification:** Minimum volume rule of 50,000 rows is independently satisfied by both Lahore and Karachi.

---

### 3. Exogenous Covariate Datasets (NASA POWER)
- **Status:** Endpoint verified (`https://power.larc.nasa.gov/api/temporal/hourly/point`).
- **Target Spatial Points:**
  - Lahore Centroid: `31.52° N, 74.35° E`
  - Karachi Centroid: `24.86° N, 67.01° E`
- **Target Variables:** `T2M`, `RH2M`, `WS10M`, `WD10M`, `PS`, `PRECTOTCORR`, `T2MDEW`.
- **Acquisition Status:** Scaffolding ready; automated ingestion to `data/raw/nasa_power/` to be initiated with manifest logging.

---

### 4. Data Warehouse Directory Status
- [x] Raw storage path exists: `c:\HIS\Low-Cost-Sensors-AQ_PakAirQuality_1-20261019_052227\`
- [ ] Canonical directory structure to create:
  - `data/raw/paqi/`
  - `data/raw/nasa_power/`
  - `data/interim/`
  - `data/processed/`
  - `data/manifests/`
