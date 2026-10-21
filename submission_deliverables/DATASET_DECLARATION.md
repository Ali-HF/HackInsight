# Dataset Declaration: HackInsight 2026 (TECHFEST '26)

**Team:** DataMinors
**Members:** Ali Hasan Farooqui, Laiba Akram, Areeba, Bushra Abid
**Track:** Air quality
**Declared:** Mon 19 Oct 2026, before 12:00 PM PKT

> Items marked **[CONFIRM]** were not verified when this was drafted. Check each one and delete the marker before committing. Delete any source line that fails its check.

---

## 1. Problem and primary user

**Problem (one or two sentences):** Lahore and Karachi regularly have unhealthy PM2.5 levels, but ground monitoring is sparse and patchy. We forecast hourly PM2.5 24 hours ahead from community-sensor and weather data, so that warnings can be targeted a day in advance.

**Primary user and decision:** A provincial Environmental Protection Department smog-response officer (Punjab, Sindh). They decide which districts get public air-quality alerts and which interventions to prioritise for the next day.

**Why this matters in Pakistan:** Pakistan Air Quality Initiative (PAQI) low-cost sensor data ranks Lahore among the most polluted major cities in the world, with an annual average PM2.5 of 105 µg/m3 in 2021 (Omar and Rosales, EGU General Assembly 2024, https://doi.org/10.5194/egusphere-egu24-453). Government monitoring has been sporadic, so community sensors are a key data source.

**Outcome predicted:** Hourly PM2.5 concentration (µg/m3), 24 hours ahead, per station and aggregated per city.

---

## 2. Sources

### Source 1: PAQI low-cost sensor network (primary data)
- **Name:** Low-Cost Sensor AQ: Pakistan Air Quality Initiative
- **Original data provider:** Pakistan Air Quality Initiative (PAQI), Karachi
- **Archive publisher:** NASA Langley Atmospheric Science Data Center DAAC (ASDC)
- **DOI:** 10.5067/LOW-COST-SENSORS-AQ/PAKAIRQUALITY
- **URL:** https://www.earthdata.nasa.gov/data/catalog/larc-cloud-low-cost-sensors-aq-pakairquality-1
- **Licence / terms:** Free download via NASA ASDC with Earthdata Login. The file header states: "Users must consult the network PI and database steward prior to use in published works." The network PI is Abid Omar (PAQI) and the database steward is Kristen Okorn (NASA Ames). The header also marks the data as field data that the network PI reserves the right to review further. We have not yet contacted them; we will do so before any publication or submission of results, and will follow their reply.
- **Coverage:** Hourly ground-site PM2.5 from 2016-10-07 12:00 UTC to 2026-03-31 19:00 UTC (79,645 rows) from 210 sensors across Pakistan. Of these, 61 sensors have at least one year of readings. Sensor locations are in the file header, not in the table.
- **Format:** One ICARTT text file, `Low-Cost-Sensors-AQ_PAQI_PM25_20161007_thru_20260331.ict` (181,909,140 bytes, SHA-256 892dc29a5d38af1e9f7a89996592faad0b2d93cb66bf3ebf72406d748819fe13), timestamps in UTC, one PM2.5 column (µg/m3) per sensor (210 columns), missing values coded -9999. Curated for NASA's Low-Cost Air Quality Sensor Harmonization Database (NASA Ames Research Center).
- **Update frequency:** Hourly time step (the most common and median gap between rows is 1 hour, with irregular outages; the longest gap is 48 days). The archive is a snapshot that ends 2026-03-31, and we treat it as static and do not depend on NASA refreshing it. See section 7 for how the hourly pipeline stays live.
- **Access:** Free, but a NASA Earthdata Login is required to download (confirmed).

### Source 2: Weather (independent covariates)
- **Name:** NASA POWER, hourly meteorological data
- **Publisher:** NASA Langley Research Center, POWER Project
- **URL:** https://power.larc.nasa.gov
- **Licence / terms:** No restrictions on use, access or download; NASA asks users to cite the NASA POWER Project, which we will do (the project's own listing also names CC BY 4.0). Source data come from NASA GMAO (MERRA-2 / GEOS-IT) and CERES.
- **Variables:** hourly 2 m temperature (T2M), relative humidity (RH2M), 10 m wind speed and direction (WS10M, WD10M), surface pressure (PS), precipitation (PRECTOT) and dew point (T2MDEW), all listed in the POWER hourly API documentation. Boundary-layer height was not verified.
- **Update frequency:** Hourly data from 2001 to near real time, with a latency of 2 to 3 days for meteorological parameters. The API takes up to 15 parameters per request. Values are grid-cell averages at the source's native resolution, so sensors in the same cell share the same weather values.

### Supporting sources (live feed and local validation)
- **Source 3: OpenAQ API (live hourly feed).** Aggregator: OpenAQ, https://openaq.org (free API key required). Confirmed so far: the station "Dawlance Pvt Ltd" in Karachi, provider Hawanama, measures PM2.5, was updated within the last 3 hours, and has reported since 2025-11-18. Hawanama is a different sensor network from PAQI. Licence: [TEAM: read each provider's licence on OpenAQ and list it here]. Lahore: the station "Model Town B LHE" (Hawanama, PM2.5, reporting since 2025-11-19) had its last update 2 days before our check, so fresh Lahore coverage is not yet confirmed. [TEAM: check more Lahore stations from Hawanama or other providers and list the ones that are fresh; delete this source for Lahore if none are.] Purpose: the hourly pipeline needs new data each hour, and Source 1 is an archive. These stations start in late 2025, so they supply live data and an out-of-network check, not training history.
- **Source 4: Environment Protection Department, Government of Punjab, daily AQI reports.** URL: https://epd.punjab.gov.pk. Format: PDF. Licence / terms: [CONFIRM]. Purpose: local validation of sensor readings against government monitors in Lahore.

---

## 3. Which source is not on the track list, and why is it credible?

Source 1 (PAQI, via NASA ASDC) is not on the air-quality track list. It has an original publisher (PAQI), a NASA-hosted archive with a DOI, and peer-reviewed use of the same network in published work (EGU 2024). Source 4 (Punjab EPD) is a government publisher, also off the track list.

**Independence:** Sources 1 and 2 are produced by different organisations and measure different things (ground pollution vs. meteorology). Neither is a copy of the other.

---

## 4. Expected volume

Measured from the downloaded file by bounding box: Karachi has 18 sensors with 143,382 non-missing hourly PM2.5 readings, and Lahore has 68 sensors with 479,145. There are 32,397 distinct hours with at least one reading from each city, roughly 3.7 years. Both cities exceed the 50,000-row minimum on their own. Final counts will be recorded in `manifest.csv` after ingestion.

Minimum required: 50,000 rows, or 2 years of hourly data.

---

## 5. Why this data fits

Hourly ground-sensor PM2.5 gives enough volume and real quality problems to engineer: outages, flat-lined readings, humidity effects on low-cost sensors, duplicates and time-zone alignment. Weather drivers (wind, humidity, temperature) are the main physical explanation for PM2.5 changes, so they are the natural covariates. The primary user needs next-day information, which an hourly 24-hour-ahead forecast provides.

**Limits we know about:** low-cost sensors are less accurate than reference monitors, and the file is marked as field data not yet fully reviewed by the network PI. Coverage is uneven: only 61 of 210 sensors have a year or more of readings, and the table is not a complete hourly grid, so gaps must be reindexed and flagged, not filled silently. Sensor coordinates come from the file header and will be shown only at about 1 km (2 decimals) or district level, never as exact locations.

---

## 6. Baseline (declared before any results)

- **Baseline:** Seasonal naive. The forecast for hour t+24 is the observed PM2.5 at hour t (the same hour the previous day). At a 24-hour horizon this is identical to persistence.
- **Metric:** Mean absolute error (MAE) in µg/m3, with RMSE reported as secondary.
- **Evaluation:** Time-based split. Train on earlier periods, validate on a later period, and hold out the final period as an untouched test set.
- **What counts as better:** Our model's test MAE is at least 10% lower than the baseline's, overall, and it is not worse than the baseline for any city or season group. [TEAM: you may change the 10% now, but not after seeing results.]

This baseline will not be changed after results are seen.

---

## 7. Hourly pipeline plan

- **Training and backfill:** the PAQI archive above (a static snapshot to 2026-03-31) plus NASA POWER weather for the same period.
- **Live hourly run:** the Prefect flow checks for new data every hour. Live PM2.5 comes from OpenAQ stations run by other providers (for example Hawanama), which are a different sensor network from the PAQI training data. The Data Quality Agent and drift monitor will compare live readings against the PAQI history and flag any offset between the two networks. [TEAM: confirm Karachi and Lahore station coverage.] NASA POWER meteorology lags by 2 to 3 days, so the most recent hours of weather must come from a near-real-time source [TEAM: choose one, for example Open-Meteo, which is on the guide's list].
- **Replay fallback:** if no live PM2.5 source is confirmed, the hourly flow replays real archived hours from a reserved period (never the held-out test set), one step per run. The dashboard and Summary.pdf will label this clearly as a replay of archived data, not live data.
