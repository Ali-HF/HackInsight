"""
Command-Line Interface (CLI) for Data Pipeline.
HackInsight 2026 - Member 1: Reproducibility & Automation Interface.

Usage:
    python -m src.data_pipeline.cli make-data
"""

import sys
import argparse
from typing import Optional
from pathlib import Path
import pandas as pd

from src.data_pipeline.provenance.manifest import ManifestManager
from src.data_pipeline.ingestion.paqi_ingestion import PAQIIngestionManager
from src.data_pipeline.ingestion.nasa_power_ingestion import NASAPowerIngestionManager
from src.data_pipeline.cleaning.cleaner import DataCleaner
from src.data_pipeline.processing.gold_builder import GoldDatasetBuilder
from src.data_pipeline.validation.quality_engine import ValidationEngine
from src.data_pipeline.validation.data_quality_agent import DataQualityAgent


def run_make_data(base_dir: Path):

    print("=" * 80)
    print("HACKINSIGHT 2026: MEMBER 1 'MAKE DATA' PIPELINE EXECUTION")
    print("=" * 80)

    # 1. Directories setup
    raw_paqi_dir = base_dir / "Low-Cost-Sensors-AQ_PakAirQuality_1-20261019_052227"
    raw_icartt_path = raw_paqi_dir / "Low-Cost-Sensors-AQ_PAQI_PM25_20161007_thru_20260331.ict"
    raw_power_dir = base_dir / "data" / "raw" / "nasa_power"
    interim_dir = base_dir / "data" / "interim"
    processed_dir = base_dir / "data" / "processed"
    manifest_path = base_dir / "data" / "manifests" / "manifest.csv"
    quality_log_path = base_dir / "reports" / "data_quality" / "quality_log.csv"
    val_report_path = base_dir / "reports" / "data_quality" / "validation_report.json"

    for d in [raw_power_dir, interim_dir, processed_dir, manifest_path.parent, quality_log_path.parent]:
        d.mkdir(parents=True, exist_ok=True)

    # 2. Manifest Manager
    print("\n[Step 1/6] Initializing Manifest & Registering PAQI Raw Artifact...")
    manifest_mgr = ManifestManager(manifest_path)
    if raw_icartt_path.exists():
        manifest_mgr.record_artifact(
            source_id="SRC-PAQI-PM25",
            source_name="Low-Cost Sensor AQ: Pakistan Air Quality Initiative",
            publisher="Pakistan Air Quality Initiative / NASA ASDC DAAC",
            source_url="https://doi.org/10.5067/LOW-COST-SENSORS-AQ/PAKAIRQUALITY",
            raw_file_path=raw_icartt_path,
            license_str="NASA ASDC Open Data (Stipulation: Consult Network PI)",
            file_format="text/icartt",
            row_count=79645
        )
        print(f"  PAQI raw artifact verified and recorded: {raw_icartt_path.name}")
    else:
        raise FileNotFoundError(f"Missing raw PAQI file at {raw_icartt_path}")

    # 3. NASA POWER Ingestion
    print("\n[Step 2/6] Acquiring NASA POWER Hourly Meteorology (2022 - 2024)...")
    power_ingest = NASAPowerIngestionManager(raw_power_dir)
    target_cities = [
        {"city": "Lahore", "lat": 31.5200, "lon": 74.3500},
        {"city": "Karachi", "lat": 24.8600, "lon": 67.0100}
    ]
    years = ["2022", "2023", "2024"]

    for tc in target_cities:
        for yr in years:
            start_d = f"{yr}0101"
            end_d = f"{yr}1231"
            print(f"  Fetching NASA POWER for {tc['city']} ({yr})...")
            saved_json = power_ingest.fetch_and_preserve(
                city_name=tc["city"],
                latitude=tc["lat"],
                longitude=tc["lon"],
                start_date=start_d,
                end_date=end_d
            )
            manifest_mgr.record_artifact(
                source_id=f"SRC-NASA-POWER-{tc['city'].upper()}-{yr}",
                source_name=f"NASA POWER Hourly Meteorology - {tc['city']} {yr}",
                publisher="NASA Langley Research Center POWER Project",
                source_url=power_ingest.BASE_URL,
                raw_file_path=saved_json,
                license_str="CC BY 4.0 / Public Domain",
                file_format="application/json",
                query_parameters={"city": tc["city"], "year": yr, "lat": tc["lat"], "lon": tc["lon"]}
            )

    # 4. PAQI Ingestion & Header Metadata Extraction
    print("\n[Step 3/6] Parsing PAQI Sensor Metadata & Filtering Target Cities...")
    paqi_mgr = PAQIIngestionManager(raw_icartt_path)
    wide_df, meta_df = paqi_mgr.load_raw_table(target_cities=["Lahore", "Karachi"])
    print(f"  Extracted {len(meta_df)} sensors for Lahore & Karachi.")
    print(f"  Loaded raw wide table with {len(wide_df):,} rows and {len(wide_df.columns)} columns.")

    # 5. Cleaning & Reshaping to Long Panel
    print("\n[Step 4/6] Reshaping Wide Matrix to Long Format & Standardizing UTC (2022-2024)...")
    cleaner = DataCleaner(interim_dir)
    cleaned_df, clean_audit = cleaner.reshape_to_long_format(
        wide_df=wide_df,
        sensor_metadata_df=meta_df,
        start_year=2022,
        end_year=2024
    )
    print(f"  Cleaned long panel rows: {len(cleaned_df):,}")
    print(f"  Audit metrics: {clean_audit}")
    interim_path = interim_dir / "cleaned_pm25_long.parquet"
    cleaned_df.to_parquet(interim_path, index=False)
    print(f"  Saved interim panel to {interim_path}")

    # 6. Weather Alignment & Gold Processing
    print("\n[Step 5/6] Aligning Weather Covariates & Building Forecasting Target (24h Ahead)...")
    gold_builder = GoldDatasetBuilder(processed_dir)
    weather_df = gold_builder.load_all_nasa_power(raw_power_dir)
    print(f"  Loaded {len(weather_df):,} hourly weather observations.")

    merged_df = gold_builder.align_weather_and_pollution(cleaned_df, weather_df)
    print(f"  Merged PM2.5 + Weather aligned rows: {len(merged_df):,}")

    gold_df = gold_builder.construct_forecasting_target(merged_df, horizon_hours=24)
    gold_path = gold_builder.export_gold_parquet(gold_df, "gold_pm25_forecasting.parquet")
    print(f"  Built canonical Gold table: {len(gold_df):,} rows.")
    print(f"  Exported Gold dataset to: {gold_path}")

    # 7. Validation Engine & Quality Reporting
    print("\n[Step 6/6] Executing Deterministic Validation Engine & Generating Report...")
    val_engine = ValidationEngine(quality_log_path)
    expected_cols = [
        "record_id", "timestamp_utc", "city", "sensor_id",
        "latitude", "longitude", "pm25", "pm25_baseline_persistence", "pm25_target_24h",
        "T2M", "RH2M", "WS10M", "WD10M", "PS", "PRECTOTCORR", "T2MDEW"
    ]
    report = val_engine.run_full_validation(gold_df, expected_cols, val_report_path)
    print(f"  Validation Status: {report['status']}")
    print(f"  Total Checks Run: {len(report['checks'])}")
    print(f"  Validation Report: {val_report_path}")
    print(f"  Quality Log: {quality_log_path}")

    print("\n" + "=" * 80)
    print("SUCCESS: ALL MEMBER 1 DATA ENGINEERING DELIVERABLES GENERATED!")
    print(f"  - Gold Parquet: {gold_path} ({gold_df.shape[0]:,} rows, {gold_df.shape[1]} columns)")
    print(f"  - Manifest CSV: {manifest_path}")
    print(f"  - Quality Report: {val_report_path}")
    print("=" * 80)


def run_quality_agent(base_dir: Path, input_path: Optional[Path] = None, auto_remediate: bool = False):
    input_file = input_path or (base_dir / "data" / "processed" / "gold_pm25_forecasting.parquet")
    if not input_file.exists():
        raise FileNotFoundError(f"Dataset not found at {input_file}")

    print("=" * 80)
    print("HACKINSIGHT 2026: DATA QUALITY AGENT AUDIT")
    print("=" * 80)
    print(f"Target: {input_file}")
    print(f"Remediation Enabled: {auto_remediate}")

    df = pd.read_parquet(input_file) if str(input_file).endswith(".parquet") else pd.read_csv(input_file)
    agent = DataQualityAgent()
    _, report = agent.run_assessment(df, auto_remediate=auto_remediate)

    print(f"\nStatus:          {report['overall_status']}")
    print(f"Records Checked: {report['total_records_checked']:,}")
    print(f"Actions Summary: {report['actions_summary']}")
    print(f"Findings:        {len(report['findings'])}")
    print("=" * 80)
    return report


def main():
    base_dir = Path(__file__).resolve().parent.parent.parent
    parser = argparse.ArgumentParser(description="HackInsight 2026 PM2.5 Data Pipeline CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available pipeline stages")
    subparsers.add_parser("make-data", help="Rebuild all layers (raw -> cleaned -> gold) end-to-end")

    qa_parser = subparsers.add_parser("quality-agent", help="Run Data Quality Agent audit & policy on dataset")
    qa_parser.add_argument(
        "--input",
        type=Path,
        default=base_dir / "data" / "processed" / "gold_pm25_forecasting.parquet",
        help="Path to input dataset"
    )
    qa_parser.add_argument(
        "--auto-remediate",
        action="store_true",
        help="Apply safe deterministic FIX and bounded FILL actions"
    )

    args = parser.parse_args()

    if args.command == "make-data":
        run_make_data(base_dir)
    elif args.command == "quality-agent":
        run_quality_agent(base_dir, input_path=args.input, auto_remediate=args.auto_remediate)
    else:
        # Default behavior: run make-data
        run_make_data(base_dir)


if __name__ == "__main__":
    main()

