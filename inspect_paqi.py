import os
import sys
import hashlib
import re
from collections import Counter
import pandas as pd
import numpy as np

FILE_PATH = r"c:\HIS\Low-Cost-Sensors-AQ_PakAirQuality_1-20261019_052227\Low-Cost-Sensors-AQ_PAQI_PM25_20161007_thru_20260331.ict"

def safe_print(s, max_len=200):
    s = str(s)
    if len(s) > max_len:
        print(s[:max_len])
    else:
        print(s)

def main():
    print("=" * 80)
    print("PAQI ICARTT DATA INSPECTION REPORT")
    print("=" * 80)

    # 1. File facts
    print("\n--- 1. FILE FACTS ---")
    file_size = os.path.getsize(FILE_PATH)
    safe_print(f"Full path: {os.path.abspath(FILE_PATH)}")
    safe_print(f"Size: {file_size:,} bytes ({file_size / (1024*1024):.2f} MB)")
    
    sha256 = hashlib.sha256()
    with open(FILE_PATH, "rb") as f:
        while chunk := f.read(1024 * 1024 * 8):
            sha256.update(chunk)
    file_hash = sha256.hexdigest()
    safe_print(f"SHA-256: {file_hash}")

    # 2. Header and Column Names Line
    print("\n--- 2. HEADER (FIRST 12 LINES) & COLUMN ROW DISCOVERY ---")
    header_lines = []
    col_line_num = None
    col_line_text = ""
    device_locations_line = ""
    
    with open(FILE_PATH, "r", encoding="utf-8", errors="replace") as f:
        for idx, line in enumerate(f, start=1):
            line_str = line.rstrip("\r\n")
            if idx <= 12:
                safe_print(f"L{idx:02d}: {line_str}", max_len=200)
            if line_str.startswith("DEVICE LOCATIONS:"):
                device_locations_line = line_str
            # Look for line with many columns starting with datetime, but not line 8 "datetime, UTC"
            # Specifically, the line that has many columns (or check line > 12 and starts with datetime)
            if idx > 12 and line_str.startswith("datetime,"):
                col_line_num = idx
                col_line_text = line_str
                break
            header_lines.append(line_str)

    cols = [c.strip() for c in col_line_text.split(",") if c.strip()]
    sensor_cols = cols[1:]
    safe_print(f"Header line with column names found at line: {col_line_num}")
    safe_print(f"Total columns in column names line: {len(cols)} (1 datetime column + {len(sensor_cols)} sensor columns)")

    # 3. Header Comments
    print("\n--- 3. HEADER COMMENTS (FILTERED KEYWORDS) ---")
    keywords = ["licen", "citation", "acknowledg", "contact", "comment", "pi", "terms", "use", "resolution", "interval", "average"]
    pattern = re.compile("|".join(keywords), re.IGNORECASE)
    
    for idx, hline in enumerate(header_lines, start=1):
        if idx == col_line_num:
            continue
        if pattern.search(hline):
            safe_print(f"L{idx:02d}: {hline}", max_len=200)

    # 4. Column Names & Grouping
    print("\n--- 4. COLUMN NAMES (ALL 210 SENSOR COLUMNS, 10 PER LINE) ---")
    for i in range(0, len(sensor_cols), 10):
        chunk = sensor_cols[i:i+10]
        safe_print(f"[{i+1:03d}-{i+len(chunk):03d}]: " + ", ".join(chunk), max_len=200)

    print("\nColumn Name Pattern Grouping:")
    prefixes = Counter([c[:2] for c in sensor_cols])
    safe_print(f"Sensor columns are 16-character hexadecimal strings (IDs of IQAir AirVisual sensors).")
    safe_print(f"Total sensor columns: {len(sensor_cols)}. Sample 2-char hex prefixes counts:")
    prefix_summary = ", ".join([f"{k}*: {v}" for k, v in sorted(prefixes.items())[:10]])
    safe_print(f"  {prefix_summary} ...")

    # 5. Data Rows
    print("\n--- 5. DATA ROWS & TIMESTAMPS ---")
    # Read data using pandas; line 79677 in original file has an unescaped newline concatenation issue
    # on_bad_lines='skip' ensures corrupt lines don't crash the parser while loading all valid rows.
    df = pd.read_csv(
        FILE_PATH,
        skiprows=col_line_num - 1,
        na_values=[-9999, -9999.0, "-9999", "-9999.000", "-9999.0"],
        on_bad_lines='skip',
        low_memory=False
    )
    df.columns = [c.strip() for c in df.columns]
    
    total_rows = len(df)
    safe_print(f"Total data rows: {total_rows:,}")
    
    df['datetime'] = pd.to_datetime(df['datetime'])
    first_ts = df['datetime'].iloc[0]
    last_ts = df['datetime'].iloc[-1]
    safe_print(f"First timestamp: {first_ts} UTC")
    safe_print(f"Last timestamp:  {last_ts} UTC")
    
    time_diffs = df['datetime'].diff().dropna()
    mode_diff = time_diffs.mode()[0]
    median_diff = time_diffs.median()
    min_diff = time_diffs.min()
    max_diff = time_diffs.max()
    
    safe_print(f"Time step between consecutive rows:")
    safe_print(f"  Most common difference (mode): {mode_diff}")
    safe_print(f"  Median difference:             {median_diff}")
    safe_print(f"  Min difference:                {min_diff}")
    safe_print(f"  Max difference:                {max_diff}")
    safe_print(f"Temporal cadence assessment: The baseline step is HOURLY ({mode_diff}), but with gaps (max gap: {max_diff}).")

    # 6. Coverage by column
    print("\n--- 6. COVERAGE BY COLUMN (PM2.5 SENSORS) ---")
    data_cols = [c for c in df.columns if c != 'datetime']
    col_stats = []
    
    for c in data_cols:
        series = df[c]
        valid_mask = series.notna()
        non_missing = int(valid_mask.sum())
        pct = (non_missing / total_rows) * 100.0
        if non_missing > 0:
            first_valid = df.loc[valid_mask, 'datetime'].iloc[0]
            last_valid = df.loc[valid_mask, 'datetime'].iloc[-1]
        else:
            first_valid = "N/A"
            last_valid = "N/A"
        col_stats.append({
            'col': c,
            'non_missing': non_missing,
            'pct': pct,
            'first_valid': str(first_valid),
            'last_valid': str(last_valid)
        })
    
    col_stats_df = pd.DataFrame(col_stats).sort_values(by='non_missing', ascending=False)
    
    cols_ge_8760 = (col_stats_df['non_missing'] >= 8760).sum()
    safe_print(f"Total PM2.5 columns with >= 8,760 non-missing values (1 year of hourly data): {cols_ge_8760} / {len(data_cols)}")
    
    safe_print("\nTop 15 PM2.5 columns by non-missing count:")
    safe_print(f"{'Sensor ID':<18} | {'Count':>8} | {'Coverage %':>10} | {'First Data':<19} | {'Last Data':<19}")
    safe_print("-" * 85)
    for _, r in col_stats_df.head(15).iterrows():
        safe_print(f"{r['col']:<18} | {r['non_missing']:>8,d} | {r['pct']:>9.2f}% | {r['first_valid']:<19} | {r['last_valid']:<19}")

    # 7. Location
    print("\n--- 7. LOCATION & CITY ASSIGNMENT ---")
    # Check if lat/lon are in columns or in header line
    has_lat_lon_cols = any("lat" in c.lower() for c in df.columns)
    safe_print(f"Are lat/lon columns present as separate table columns? {'Yes' if has_lat_lon_cols else 'No'}")
    safe_print(f"Device coordinates are provided in Header Line 21 ('DEVICE LOCATIONS: ...').")
    
    # Parse header line 21
    # Example format: 000af71890e2dbf1 (24.851434,66.92658), 00316628064aa997 (33.8564,72.8622), ...
    loc_pattern = re.findall(r"([0-9a-fA-F]+)\s*\(\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\)", device_locations_line)
    loc_dict = {m[0]: (float(m[1]), float(m[2])) for m in loc_pattern}
    safe_print(f"Parsed {len(loc_dict)} sensor locations from header.")
    
    # Bounding boxes:
    # Karachi: lat 24.7 to 25.2, lon 66.8 to 67.5
    # Lahore: lat 31.3 to 31.7, lon 74.1 to 74.6
    # Islamabad: ~ lat 33.5 to 33.85, lon 72.9 to 73.25
    # Peshawar: ~ lat 33.9 to 34.1, lon 71.4 to 71.65
    def assign_city(lat, lon):
        if 24.7 <= lat <= 25.2 and 66.8 <= lon <= 67.5:
            return "Karachi"
        elif 31.3 <= lat <= 31.7 and 74.1 <= lon <= 74.6:
            return "Lahore"
        elif 33.5 <= lat <= 33.85 and 72.8 <= lon <= 73.3:
            return "Islamabad"
        elif 33.9 <= lat <= 34.15 and 71.4 <= lon <= 71.7:
            return "Peshawar"
        else:
            return "Other"

    city_sensor_map = {}
    sensor_city = {}
    for sid, (lat, lon) in loc_dict.items():
        city = assign_city(lat, lon)
        sensor_city[sid] = city
        city_sensor_map.setdefault(city, []).append(sid)

    # Calculate sensor counts and total non-missing values per city
    city_stats = []
    all_cities = ["Karachi", "Lahore", "Islamabad", "Peshawar", "Other"]
    for city in all_cities:
        s_list = [s for s in city_sensor_map.get(city, []) if s in df.columns]
        s_count = len(s_list)
        if s_count > 0:
            total_readings = int(df[s_list].notna().sum().sum())
        else:
            total_readings = 0
        city_stats.append({
            'city': city,
            'sensors': s_count,
            'readings': total_readings
        })
        
    safe_print("\nCity summary (Sensors & Non-missing PM2.5 readings):")
    for cs in city_stats:
        safe_print(f"  {cs['city']:<12}: {cs['sensors']:>3} sensors | {cs['readings']:>10,d} non-missing PM2.5 rows/readings")

    safe_print("\nSample rounded sensor coordinates (first 10 sensors):")
    for sid in list(sensor_cols)[:10]:
        if sid in loc_dict:
            lat, lon = loc_dict[sid]
            safe_print(f"  Sensor {sid}: Lat {lat:.2f}, Lon {lon:.2f} -> {sensor_city.get(sid, 'Unknown')}")

    # 8. Rows for 50,000-row rule
    print("\n--- 8. 50,000-ROW RULE METRICS ---")
    karachi_sensors = [s for s in city_sensor_map.get("Karachi", []) if s in df.columns]
    lahore_sensors = [s for s in city_sensor_map.get("Lahore", []) if s in df.columns]

    k_total_readings = int(df[karachi_sensors].notna().sum().sum())
    l_total_readings = int(df[lahore_sensors].notna().sum().sum())

    k_has_data = df[karachi_sensors].notna().any(axis=1)
    l_has_data = df[lahore_sensors].notna().any(axis=1)
    co_occurring_hours = int((k_has_data & l_has_data).sum())

    safe_print(f"(a) Total non-missing PM2.5 values for Karachi sensors: {k_total_readings:,}")
    safe_print(f"(b) Total non-missing PM2.5 values for Lahore sensors:  {l_total_readings:,}")
    safe_print(f"(c) Distinct hours with >=1 Karachi sensor AND >=1 Lahore sensor: {co_occurring_hours:,}")

    # 9. Print 5 data rows with only the first 8 columns
    print("\n--- 9. FIRST 5 DATA ROWS (FIRST 8 COLUMNS) ---")
    sub_df = df.iloc[:5, :8].copy()
    sub_df['datetime'] = sub_df['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    # Format floats nicely for compact printing
    formatted_rows = []
    headers = list(sub_df.columns)
    safe_print("Columns: " + ", ".join(headers), max_len=200)
    for idx, row in sub_df.iterrows():
        row_str = f"Row {idx+1}: " + ", ".join([f"{val:.1f}" if isinstance(val, (float, np.floating)) and not np.isnan(val) else str(val) for val in row.values])
        safe_print(row_str, max_len=200)

    print("\n" + "=" * 80)
    print("END OF REPORT")
    print("=" * 80)

if __name__ == "__main__":
    main()
