# NASA ICARTT Inspection Report: PAQI Low-Cost Sensors

This report summarizes the structure, coverage, and geographic distribution of the NASA ICARTT dataset for the **Pakistan Air Quality Initiative (PAQI)**.

---

## 1. File Facts

- **Full Path**: [`c:/HIS/Low-Cost-Sensors-AQ_PakAirQuality_1-20261019_052227/Low-Cost-Sensors-AQ_PAQI_PM25_20161007_thru_20260331.ict`](file:///c:/HIS/Low-Cost-Sensors-AQ_PakAirQuality_1-20261019_052227/Low-Cost-Sensors-AQ_PAQI_PM25_20161007_thru_20260331.ict)
- **Size**: `181,909,140 bytes` (~173.48 MB)
- **SHA-256 Hash**: `892dc29a5d38af1e9f7a89996592faad0b2d93cb66bf3ebf72406d748819fe13`

---

## 2. Header & Column Names Discovery

### First 12 Header Lines
```text
L01: 38, 1001, V02_2016
L02: Okorn, Kristen
L03: NASA Ames Research Center
L04: Low-Cost Air Quality Sensor Harmonization Database
L05: 1, 1
L06: 2016-10-07,2026-03-31
L07: 0
L08: datetime, UTC
L09: 210
L10: 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ...
L11: -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, -9999, ...
L12: PM2.5, µg/m3, AerComp_PM2.5_InSitu_S_ConcAMB
```

### Column Header Discovery
- **Line Number**: `Line 38`
- **Total Columns**: `211` (`1` datetime column + `210` sensor PM2.5 columns)

---

## 3. Filtered Header Comments
Lines matching keywords (*licen, citation, acknowledg, contact, comment, PI, terms, use, resolution, interval, average*):

```text
L16: NETWORK_PI_NAME: Abid Omar
L17: NETWORK_PI_CONTACT_INFO:  abidomar@pakairquality.com
L18: NETWORK_PI_ORGANIZATION: Pakistan Air Quality Initiative (PAQI) 
L33: DATABASE_STEWARD_CONTACT_INFO: Kristen.E.Okorn@nasa.gov
L34: STIPULATIONS_ON_USE: Users must consult the network PI and database steward prior to use in published works. 
L35: OTHER_COMMENTS: Additional authors: Mahad Naveed (mahad@pakairquality.com), Rehan Ahmed (rehan@pakairquality.com), Mariam Shah (mariam@pakairquality.com)
L37: R0: Field data. Network PI reserves the right to further review.
```

---

## 4. Column Names & Pattern Grouping

### All 210 Sensor Columns (10 per line)
```text
[001-010]: 000af71890e2dbf1, 00316628064aa997, 01158ee1c18b5916, 0166919645da6ef4, 01c528b42626d36e, 01cb11a02fbad27d, 0229975e57cec661, 04828ef5b22a5e88, 09b43cad51ccf712, 09bfbe1b7bfa16dd
[011-020]: 0bd9ce5023d669ab, 0d1de89e3c372ea2, 0d27385057cf528b, 0e704a936768079b, 0e787a4bf6cdaf47, 10005e3ec93f5c71, 11e1141345d80f7a, 11ee979335c22a4c, 1251d218976223e7, 14e13564dccf4712
[021-030]: 16bc4eb2f9dee236, 181108be164cedd4, 18302d59b3dcedfd, 187dd75d67e1418d, 1d4b199479439fd7, 1dae021c73b530ba, 1dec46bf0c0bf927, 1f5984bcb31adfa3, 201176fcf03db7a5, 2029a09b331639fb
[031-040]: 2071d746a3be8ef8, 208fcb0851270290, 212607b3f328c11e, 21a82687cf76b74d, 25462c2d711aa44c, 26a188da9fe33568, 2885eeb1f9766298, 2a87cfb9bec4e113, 2bae893d12d717f1, 2c80a2a7c06ae4b4
[041-050]: 2d60f5cbd49648f2, 2dfc2c7939f4ba1d, 2eec61fbcc564cb2, 305e0ea290786cc3, 31dd9a87e9e458e5, 327657ee6caa1b4e, 328b790d1e52a2e8, 35fac158af0af89d, 36ba08bb4090e390, 3764691961ffe5dd
[051-060]: 384d322ac29e221e, 388f60be484df4a1, 396907de153a3439, 39fc6886a92cbb55, 3c60cc1e5e53e71c, 4109c9df0fccd9c2, 418085c7e812033a, 4199b4b3726541cf, 41c379c402d5f100, 440b727059f48013
[061-070]: 445be36a99f5083c, 44adc33b90d970e4, 459e50464db44a42, 45f8deb2fc305733, 475014d5a80dc720, 482400d4cfb1d81d, 48686fef420dd9ea, 4aedd826fc14959a, 4b3f1fb60e87a621, 4efcde94ea3e7ce1
[071-080]: 4f992d83d92ccd8d, 502f23a2457a9c85, 5368f47df5c9a581, 53b2bb9d01a3795d, 54042139917a1eda, 54445595a30dd488, 546e85738630ee3d, 5548f350a81869f6, 5843c0098bbb097c, 5870bfcdc4343145
[081-090]: 5a238a3ce8b9cd83, 5a443850a604ed17, 5bb959d241332344, 5e2414310cb27131, 5e244c2e96e9bdef, 5e5aee1ffc2d6acd, 60b141be1a707d5c, 61792f2950a66f95, 66f181d2282c958b, 6916f3c4e7d3254e
[091-100]: 6a9103245e5ea261, 6a9b7fdd98ee6e6a, 6d8c9c24d3d40c4b, 6e6d87e598d5f1b3, 6f9f62e033857447, 72373d3383e029c6, 735557e6a3668452, 754cd9a87fa643bf, 774a228df6319a99, 787d8004c5f37626
[101-110]: 793d1e10dddf953d, 794c407d1677dc5f, 79a353032fdf6af5, 7acf642a024d3ff3, 7e50442087c45e90, 8196daf79f17abf3, 82bfbf797dd6955f, 833a5d15fda8218f, 83a45fc747d5b8d7, 8639b4c7331db6b1
[111-120]: 88167af74e5088cc, 887338e4b2f8f39a, 8a18e99d7776d47e, 8bc6579e846ac484, 8c38e7c4714f1f41, 8cbd041d727fdc5e, 8db904c4d731521a, 8f2711baec0814fd, 8fac3bebcd73ef63, 8fc1d6e5e0a8ecd6
[121-130]: 92a5a8fc8dcad510, 9360e939d902bcd2, 961403b36a531da2, 97b3837630233ff6, 986cf858365a818d, 9971b70b48d24ee9, 99ebc8e7120fb58d, 9a9d72fde36224ee, 9aa596b036b8be0a, 9acdc6a42e209000
[131-140]: 9ba2a4f73affd9f2, 9dae1765c5930fd9, 9e7b2e644f96b4c8, 9ff4cfe903b666d5, a3725ce03348f804, a457088972c50ef5, a4defe055d1b6fd7, a53520b232a06e63, a6536d88258d6bda, a7ed7ba1ce81de11
[141-150]: a8550e2261139eaf, a9bb53125bd879c9, a9f6c13039a5aec4, aab7f80a9fc84210, ac1392b9f25ddc40, acda8362e2839bc1, adfb25e4298c4be9, ae299b641395f0c6, b14746f3a30fceb6, b4bed8fb8aa8217b
[151-160]: b5ad25b44220eece, b61df992faaec59f, b6a2a99d9e2de9fd, b9e2dcc15ae718b0, ba39f0c3176796db, bb31fd52fc084a0b, bb5256cb24faf141, bb76cbf2190d9d7a, be0ef804a044ef6c, be7042ef277b5be0
[161-170]: c1c40e1cf035a44e, c29820871c474712, c2aec78a010011fc, c2af7d6fe582309c, c54e55efe683597e, c56ace7d9faab268, c67118d4cebaab14, c7313ab5e91c4b6d, c7def5483f121d71, c8cc69fb28624319
[171-180]: c96db865f54f7d0d, ca6917dbf6531bad, cb170466778ad5c5, ce587d03baa6b945, cffdd760b8c7d12d, d123034f4eedf727, d26460cf7eec5394, d36f327d730c41e9, d426e23c04f4cb55, d4913cd011bfa3c5
[181-190]: d491759a287b5af5, d4d454e7e552aa52, d5de1c046dfd6e0e, d73207a17a4c05b0, d736fbcdae93e9ed, d7907b59134614a5, d84fcdd4abd6999e, d8ad5fff96d10f65, d9d232dd89ec7fc6, dfa701f6db123b3c
[191-200]: e2967d002db3032c, e327aba287a274e7, e42e819d6f66680a, e490a660ebf74315, e4ff2485fad7598e, e7363483348ff304, e8023b4d91099d7f, e91b585ad970c5a3, ec1ad06a78c1e6c0, ece2a90ada1861f8
[201-210]: ef4b4c3eb3cc9339, efdfe87682463589, f0f5790c9357aaff, f1ec4cb42cc8b123, f25b71c1c7015f2e, f3569f11bb6de867, f8476ba5897fb572, f906b5a06747fc83, f99c3c7d489ec5ef, f9b64d9661c2470a
```

### Pattern Analysis
- **Column Structure**: Unlike datasets with prefixes such as `pm25_<id>` or `lat_<id>`, all 210 sensor columns are **16-character hexadecimal device hashes** corresponding to IQAir AirVisual sensors.
- **Prefix Distribution (First 2 hex characters)**:
  `0x`: 15, `1x`: 13, `2x`: 15, `3x`: 13, `4x`: 14, `5x`: 16, `6x`: 10, `7x`: 13, `8x`: 15, `9x`: 16, `ax`: 15, `bx`: 11, `cx`: 16, `dx`: 15, `ex`: 11, `fx`: 12.

---

## 5. Data Rows & Cadence

- **Total Rows**: `79,645`
- **First Timestamp**: `2016-10-07 12:00:00 UTC`
- **Last Timestamp**: `2026-03-31 19:00:00 UTC`
- **Cadence Differences**:
  - **Most common difference (mode)**: `1 hour` (`0 days 01:00:00`)
  - **Median difference**: `1 hour` (`0 days 01:00:00`)
  - **Min difference**: `1 hour` (`0 days 01:00:00`)
  - **Max difference**: `48 days 19:00:00`
- **Conclusion**: The dataset cadence is **strictly hourly** across standard operating times, with periodic irregular station downtime gaps.

---

## 6. Coverage by Column (PM2.5 Sensors)

- **PM2.5 Columns with $\ge$ 8,760 non-missing values (1 full year)**: **`61 / 210`**

### Top 15 Sensors by Data Coverage

| Sensor ID | Non-Missing Count | Coverage % | First Timestamp | Last Timestamp |
| :--- | :---: | :---: | :---: | :---: |
| `445be36a99f5083c` | **50,128** | 62.94% | 2016-10-07 12:00:00 | 2026-03-31 19:00:00 |
| `440b727059f48013` | **41,292** | 51.85% | 2018-08-28 02:00:00 | 2026-03-31 19:00:00 |
| `d5de1c046dfd6e0e` | **34,344** | 43.12% | 2018-01-04 03:00:00 | 2025-10-16 17:00:00 |
| `9ba2a4f73affd9f2` | **29,619** | 37.19% | 2022-09-19 03:00:00 | 2026-03-31 19:00:00 |
| `1f5984bcb31adfa3` | **27,773** | 34.87% | 2022-02-07 03:00:00 | 2026-03-31 19:00:00 |
| `833a5d15fda8218f` | **27,608** | 34.66% | 2022-05-10 11:00:00 | 2026-03-31 19:00:00 |
| `35fac158af0af89d` | **26,289** | 33.01% | 2019-12-13 03:00:00 | 2026-03-31 19:00:00 |
| `d4913cd011bfa3c5` | **25,348** | 31.83% | 2020-12-03 03:00:00 | 2026-03-31 11:00:00 |
| `5a238a3ce8b9cd83` | **24,752** | 31.08% | 2018-08-28 02:00:00 | 2026-03-31 19:00:00 |
| `418085c7e812033a` | **24,705** | 31.02% | 2022-06-30 06:00:00 | 2025-10-23 14:00:00 |
| `f3569f11bb6de867` | **24,254** | 30.45% | 2021-12-20 11:00:00 | 2026-03-31 19:00:00 |
| `54445595a30dd488` | **22,495** | 28.24% | 2022-12-26 07:00:00 | 2026-03-31 19:00:00 |
| `d123034f4eedf727` | **22,005** | 27.63% | 2022-04-11 03:00:00 | 2026-03-31 19:00:00 |
| `31dd9a87e9e458e5` | **19,628** | 24.64% | 2023-12-13 03:00:00 | 2026-03-31 19:00:00 |
| `72373d3383e029c6` | **19,373** | 24.32% | 2022-11-21 06:00:00 | 2026-03-27 06:00:00 |

---

## 7. Geographic Location & Bounding Box Assignment

- **Separate Lat/Lon Columns in Table**: **No**.
- **Metadata Location**: Lat/Lon coordinates are specified for each sensor ID in **Header Line 21** (`DEVICE LOCATIONS: <id> (lat, lon), ...`).
- **Bounding Boxes**:
  - **Karachi**: Lat `24.7 to 25.2`, Lon `66.8 to 67.5`
  - **Lahore**: Lat `31.3 to 31.7`, Lon `74.1 to 74.6`
  - **Islamabad**: Lat `33.5 to 33.85`, Lon `72.8 to 73.3`
  - **Peshawar**: Lat `33.9 to 34.15`, Lon `71.4 to 71.7`
  - **Other**: Locations outside the above bounding boxes

### Sensor Counts & Reading Volume by City

| City | Active Sensors | Non-Missing PM2.5 Readings |
| :--- | :---: | :---: |
| **Karachi** | 18 | 143,382 |
| **Lahore** | 68 | 479,145 |
| **Islamabad** | 22 | 203,948 |
| **Peshawar** | 11 | 78,159 |
| **Other** | 91 | 441,895 |

### Sample Sensor Coordinates (Rounded to 2 decimals)
- `000af71890e2dbf1`: Lat `24.85`, Lon `66.93` $\rightarrow$ **Karachi**
- `00316628064aa997`: Lat `33.86`, Lon `72.86` $\rightarrow$ **Other**
- `01158ee1c18b5916`: Lat `34.17`, Lon `73.25` $\rightarrow$ **Other**
- `0166919645da6ef4`: Lat `31.46`, Lon `74.53` $\rightarrow$ **Lahore**
- `01c528b42626d36e`: Lat `34.80`, Lon `72.57` $\rightarrow$ **Other**
- `01cb11a02fbad27d`: Lat `31.48`, Lon `74.31` $\rightarrow$ **Lahore**
- `0229975e57cec661`: Lat `33.99`, Lon `71.44` $\rightarrow$ **Peshawar**
- `04828ef5b22a5e88`: Lat `32.49`, Lon `74.54` $\rightarrow$ **Other**
- `09b43cad51ccf712`: Lat `32.27`, Lon `74.66` $\rightarrow$ **Other**
- `09bfbe1b7bfa16dd`: Lat `32.54`, Lon `74.48` $\rightarrow$ **Other**

---

## 8. 50,000-Row Rule Metrics

- **(a) Total non-missing PM2.5 values for Karachi sensors**: **`143,382`**
- **(b) Total non-missing PM2.5 values for Lahore sensors**: **`479,145`**
- **(c) Distinct hours with $\ge 1$ Karachi reading AND $\ge 1$ Lahore reading**: **`32,397` hours**

---

## 9. First 5 Data Rows (First 8 Columns)

Columns: `datetime`, `000af71890e2dbf1`, `00316628064aa997`, `01158ee1c18b5916`, `0166919645da6ef4`, `01c528b42626d36e`, `01cb11a02fbad27d`, `0229975e57cec661`

```text
Row 1: 2016-10-07 12:00:00, NaN, NaN, NaN, NaN, NaN, NaN, NaN
Row 2: 2016-10-07 13:00:00, NaN, NaN, NaN, NaN, NaN, NaN, NaN
Row 3: 2016-10-07 14:00:00, NaN, NaN, NaN, NaN, NaN, NaN, NaN
Row 4: 2016-10-07 15:00:00, NaN, NaN, NaN, NaN, NaN, NaN, NaN
Row 5: 2016-10-08 05:00:00, NaN, NaN, NaN, NaN, NaN, NaN, NaN
```
*(In these initial hours, sensor `445be36a99f5083c` in column 62 reported `16.0`, `19.0`, `17.0`, `14.0`, and `13.0` µg/m³).*
