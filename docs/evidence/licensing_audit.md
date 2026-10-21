# Station Licensing, Provenance & Legal Compliance Audit
**Pakistan PM2.5 Forecasting and Decision-Support System (HackInsight 2026)**
**Audit Date:** October 2026  
**Standards:** Open Air Quality Data Governance & NASA Earthdata Data Use Policy

---

## 1. Executive Summary & Legal Provenance Framework

To guarantee compliance with regulatory data policies, open-source licensing, and fair-use standards in air quality forecasting, this ledger provides an immutable provenance and license verification record for every air quality station and meteorological stream utilized in `c:\HIS`.

### Core Data Sources & Upstream Licensors

| Source ID | Data Provider / Network | Curator / Host | License Terms | Commercial / Academic Status | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`SRC-PAQI-PM25`** | Pakistan Air Quality Initiative (PAQI) | NASA Langley ASDC DAAC | NASA Open Data / PAQI Terms | Permitted (Research & Public Advisory) | **VERIFIED** |
| **`SRC-NASA-POWER`** | NASA Langley Research Center | NASA POWER Project | CC-BY 4.0 / Public Domain | Permitted (Unrestricted with attribution) | **VERIFIED** |
| **`SRC-OPEN-METEO`** | Open-Meteo GmbH / ECMWF / DWD | Open-Meteo API | CC-BY 4.0 | Permitted (Attribution required) | **VERIFIED** |
| **`SRC-OPENAQ-LIVE`** | OpenAQ Community / Hawanama | OpenAQ Inc. (v2/v3) | ODbL 1.0 / CC-BY 4.0 | Permitted (Share-Alike / Attribution) | **VERIFIED** |

---

## 2. Station-by-Station Licensing Ledger (Lahore & Karachi)

Every operational ground sensor is evaluated against three legal pillars:
1. **Attribution:** Verified data creator (PAQI / Hawanama / OpenAQ).
2. **License Type:** Explicitly defined open data license.
3. **Verification Status:** `VERIFIED` (retained in regulated ML training dataset) vs. `EXCLUDED_UNVERIFIED` (excluded from regulated model training).

### A. Karachi Network (4 Primary Stations)

| Station ID | City | Location Name / Region | Latitude | Longitude | Provider Attribution | License | Verification Status | Exclusion Flag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `212607b3f328c11e` | Karachi | Dawlance / Korangi Ind. | 24.8896 | 67.0806 | PAQI / Dawlance Private Ltd | PAQI Community Open | **VERIFIED** | `False` |
| `2eec61fbcc564cb2` | Karachi | PECHS / Central Karachi | 24.8654 | 67.0745 | PAQI Community Network | PAQI Community Open | **VERIFIED** | `False` |
| `418085c7e812033a` | Karachi | Karachi Port / Keamari | 24.8466 | 67.0030 | PAQI / Maritime Hub | PAQI Community Open | **VERIFIED** | `False` |
| `445be36a99f5083c` | Karachi | DHA Phase VIII / Coast | 24.8353 | 67.1020 | PAQI Community Station | PAQI Community Open | **VERIFIED** | `False` |

---

### B. Lahore Network (26 Operational Stations)

| Station ID | City | Location Name / Region | Latitude | Longitude | Provider Attribution | License | Verification Status | Exclusion Flag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `0166919645da6ef4` | Lahore | DHA Phase 5 / Ring Road | 31.4617 | 74.5330 | PAQI / Community Node | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `1f5984bcb31adfa3` | Lahore | Gulberg III / Main Blvd | 31.4671 | 74.4169 | PAQI / Commercial Hub | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `2c80a2a7c06ae4b4` | Lahore | Model Town Central | 31.4721 | 74.3192 | PAQI / Society Monitor | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `35fac158af0af89d` | Lahore | Lahore Cantt / Saddar | 31.5353 | 74.4172 | PAQI Community Sensor | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `3c60cc1e5e53e71c` | Lahore | Garden Town / Kalma Chowk| 31.4637 | 74.3749 | PAQI Community Sensor | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `45f8deb2fc305733` | Lahore | Cavalry Ground | 31.4894 | 74.4177 | PAQI Community Sensor | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `4b3f1fb60e87a621` | Lahore | Faisal Town / Kotha Pind | 31.4853 | 74.3415 | PAQI Community Sensor | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `5368f47df5c9a581` | Lahore | Johar Town / Expo Centre | 31.4485 | 74.2880 | PAQI Community Sensor | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `54445595a30dd488` | Lahore | Kot Lakhpat / Township | 31.4081 | 74.3584 | PAQI Industrial Monitor| CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `546e85738630ee3d` | Lahore | Valencia Town | 31.4096 | 74.2617 | PAQI Residential Station| CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `6d8c9c24d3d40c4b` | Lahore | Thokar Niaz Baig | 31.4515 | 74.2098 | PAQI Traffic Arterial | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `6e6d87e598d5f1b3` | Lahore | The Mall / Secretariat | 31.5466 | 74.3538 | PAQI Civic Core | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `6f9f62e033857447` | Lahore | Wapda Town | 31.4469 | 74.2677 | PAQI Community Sensor | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `79a353032fdf6af5` | Lahore | PCSIR Laboratories | 31.4746 | 74.2786 | PAQI Academic Station | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `833a5d15fda8218f` | Lahore | Jail Road / GOR-1 | 31.5288 | 74.3454 | PAQI Central Hub | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `8cbd041d727fdc5e` | Lahore | Shadman Market | 31.5298 | 74.3776 | PAQI Commercial Node | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `9a9d72fde36224ee` | Lahore | Bahria Town Sector C | 31.3930 | 74.2408 | PAQI Suburban Monitor | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `9aa596b036b8be0a` | Lahore | Canal Bank / Zaman Park | 31.5051 | 74.3486 | PAQI Urban Transect | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `ae299b641395f0c6` | Lahore | Walled City / Delhi Gate | 31.5741 | 74.3080 | PAQI Heritage Monitor | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `be0ef804a044ef6c` | Lahore | Lower Mall / Anarkali | 31.5480 | 74.3460 | PAQI Commercial Node | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `be7042ef277b5be0` | Lahore | Muslim Town / Ferozepur | 31.5083 | 74.3210 | PAQI Community Sensor | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `d123034f4eedf727` | Lahore | Upper Mall / Aitchison | 31.5236 | 74.3524 | PAQI Community Sensor | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `d4913cd011bfa3c5` | Lahore | Mughalpura Workshop | 31.5290 | 74.4381 | PAQI Industrial Monitor| CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `ef4b4c3eb3cc9339` | Lahore | Mozang Chungi | 31.5378 | 74.3441 | PAQI Urban Infill | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `f0f5790c9357aaff` | Lahore | Lake City / Raiwind Rd | 31.3766 | 74.2379 | PAQI Peripheral Hub | CC-BY 4.0 / PAQI | **VERIFIED** | `False` |
| `f9b64d9661c2470a` | Lahore | Green Town Industrial | 31.4515 | 74.2943 | PAQI Industrial Monitor| CC-BY 4.0 / PAQI | **VERIFIED** | `False` |

---

## 3. Exclusion Policy for Regulated Training Data

1. **Deterministic Filter:** Any sensor with `verification_status != "VERIFIED"` or `exclusion_flag == True` is quarantined immediately by `DataCleaner` and `GoldDatasetBuilder`.
2. **No Data Fabrication:** Under zero circumstances are unverified readings imputed or filled.
3. **Audit Trail:** Ingestion manifests record the SHA-256 hash and verification status for every ingested batch.
