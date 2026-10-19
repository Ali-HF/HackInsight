# Data Source Register
## Project: PM2.5 Air-Quality Forecasting in Pakistan (HackInsight 2026)

---

### Source 1: PAQI Ground Sensor Network (Primary Forecasting Target)
- **Source ID:** `SRC-PAQI-PM25`
- **Source Name:** Low-Cost Sensor AQ: Pakistan Air Quality Initiative
- **Publisher:** Pakistan Air Quality Initiative (PAQI) / Curated by NASA Langley ASDC DAAC
- **Source URL:** https://www.earthdata.nasa.gov/data/catalog/larc-cloud-low-cost-sensors-aq-pakairquality-1
- **DOI:** `10.5067/LOW-COST-SENSORS-AQ/PAKAIRQUALITY`
- **Access Method:** Direct ICARTT archive download via Earthdata credentials
- **Local File Path:** `c:/HIS/Low-Cost-Sensors-AQ_PakAirQuality_1-20261019_052227/Low-Cost-Sensors-AQ_PAQI_PM25_20161007_thru_20260331.ict`
- **SHA-256 Checksum:** `892dc29a5d38af1e9f7a89996592faad0b2d93cb66bf3ebf72406d748819fe13`
- **File Format:** ICARTT text file (ASCII, 211 comma-separated columns, 37 header lines)
- **Temporal Resolution:** Hourly time step (1-hour mode/median)
- **Coverage Period:** `2016-10-07 12:00:00 UTC` to `2026-03-31 19:00:00 UTC` (79,645 total chronological rows)
- **Geographic Coverage:** Pakistan nationwide (210 sensors: 68 Lahore, 18 Karachi, 22 Islamabad, 11 Peshawar, 91 other)
- **Coordinates:** Embedded in Header Line 21 (`DEVICE LOCATIONS: <sensor_id> (lat, lon), ...`)
- **Variables & Units:** PM2.5 concentration in $\mu g/m^3$
- **Missing Value Sentinel:** `-9999`
- **License / Terms:** Free academic/research use via NASA ASDC. Stipulation: consultation with Network PI (Abid Omar) and Database Steward (Kristen Okorn) required prior to published works.
- **Track Status:** Off-track credible primary source (justified in Section 3 of `DATASET_DECLARATION.md`).
- **Update Frequency:** Static historical archive.
- **Limitations:** Low-cost sensor drift, humidity sensitivity, uncalibrated raw field readings, sensor downtime gaps up to 48 days.

---

### Source 2: NASA POWER Hourly Meteorology (Exogenous Covariates)
- **Source ID:** `SRC-NASA-POWER`
- **Source Name:** NASA Prediction Of Worldwide Energy Resources (POWER) Hourly Meteorology
- **Publisher:** NASA Langley Research Center POWER Project
- **Source URL:** https://power.larc.nasa.gov/api/temporal/hourly/point
- **Access Method:** REST API (JSON / CSV)
- **Temporal Resolution:** Hourly
- **Coverage Period:** 2016-10-01 to near-real-time (historical archive matching PAQI)
- **Geographic Coverage:** Point/grid-cell queries at Lahore (`31.52, 74.35`) and Karachi (`24.86, 67.01`) centroids or sensor clusters
- **Variables & Units:** 
  - `T2M`: Temperature at 2 meters (°C)
  - `RH2M`: Relative Humidity at 2 meters (%)
  - `WS10M`: Wind Speed at 10 meters (m/s)
  - `WD10M`: Wind Direction at 10 meters (degrees)
  - `PS`: Surface Pressure (kPa)
  - `PRECTOTCORR`: Precipitation corrected (mm/hour)
  - `T2MDEW`: Dew/Frost Point at 2 meters (°C)
- **License / Terms:** Open data, no restrictions, CC BY 4.0 citation requested.
- **Track Status:** Standard benchmark real-time source.
- **Update Frequency:** Hourly observations with 2-to-3 day publication latency.
- **Limitations:** Gridded MERRA-2/GEOS-IT reanalysis averages (0.5° x 0.625°), not direct local ground microclimate measurements. 2-3 day latency prevents true near-real-time ingestion without a low-latency proxy.

---

### Source 3: Open-Meteo Weather API (Real-Time & Replay Inference Weather)
- **Source ID:** `SRC-OPEN-METEO`
- **Source Name:** Open-Meteo Historical & Real-Time Weather API
- **Publisher:** Open-Meteo GmbH
- **Source URL:** https://api.open-meteo.com/v1/forecast
- **Access Method:** Free REST API (no API key required)
- **Temporal Resolution:** Hourly
- **Variables:** `temperature_2m`, `relative_humidity_2m`, `wind_speed_10m`, `wind_direction_10m`, `surface_pressure`, `precipitation`
- **License / Terms:** CC BY 4.0 (Open Data)
- **Role:** High-freshness weather covariate provider for live hourly runs and short-term forecast horizons.

---

### Source 4: OpenAQ / Hawanama (Live PM2.5 Feed for Hourly Pipeline)
- **Source ID:** `SRC-OPENAQ-LIVE`
- **Source Name:** OpenAQ Real-Time Air Quality API
- **Publisher:** OpenAQ Community / Hawanama Sensor Network
- **Source URL:** https://api.openaq.org/v2/measurements
- **Access Method:** REST API (Free API Key)
- **Temporal Resolution:** Hourly updates
- **Active Tested Stations:** Karachi ("Dawlance Pvt Ltd", provider Hawanama)
- **Role:** Real-time PM2.5 ingestion for live pipeline runs in Prefect, compared against PAQI baseline via drift monitor.
