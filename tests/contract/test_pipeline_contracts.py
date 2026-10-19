"""
Contract and Integration Tests for Member 1 Data Pipeline.
HackInsight 2026 - Member 1 Testing Suite.
"""

import unittest
import tempfile
import shutil
from pathlib import Path
import pandas as pd
from src.data_pipeline.cleaning.cleaner import DataCleaner
from src.data_pipeline.validation.quality_engine import ValidationEngine
from src.data_pipeline.processing.gold_builder import GoldDatasetBuilder


class TestDataPipelineContracts(unittest.TestCase):
    """Verifies that all pipeline stages adhere to the defined contracts and interfaces."""

    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp())
        self.cleaner = DataCleaner(interim_dir=self.test_dir / "interim")
        self.validator = ValidationEngine(quality_log_path=self.test_dir / "quality_log.csv")
        self.builder = GoldDatasetBuilder(processed_dir=self.test_dir / "processed")

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_cleaner_contract(self):
        """Verify reshape_to_long_format interface execution."""
        df_sample = pd.DataFrame({
            "datetime": ["2023-01-01 00:00:00", "2023-01-01 01:00:00"],
            "s1": [45.0, 50.0]
        })
        meta_sample = pd.DataFrame({
            "sensor_id": ["s1"],
            "latitude": [31.52],
            "longitude": [74.35],
            "city": ["Lahore"]
        })
        cleaned, audit = self.cleaner.reshape_to_long_format(
            df_sample, meta_sample, start_year=2023, end_year=2023
        )
        self.assertEqual(len(cleaned), 2)
        self.assertIn("timestamp_utc", cleaned.columns)
        self.assertIn("pm25", cleaned.columns)

    def test_validator_contract(self):
        """Verify evaluate_schema and duplicate validation execution."""
        df_sample = pd.DataFrame({
            "record_id": ["rec1", "rec2"],
            "pm25_target_24h": [45.0, 55.0],
            "T2M": [20.0, 22.0],
            "RH2M": [50.0, 55.0]
        })
        report = self.validator.run_full_validation(
            df_sample,
            expected_columns=["record_id", "pm25_target_24h", "T2M", "RH2M"],
            output_report_path=self.test_dir / "report.json"
        )
        self.assertEqual(report["status"], "PASS")
        self.assertTrue((self.test_dir / "report.json").exists())

    def test_gold_builder_contract(self):
        """Verify construct_forecasting_target interface execution."""
        df_sample = pd.DataFrame({
            "timestamp_utc": pd.to_datetime(["2023-01-01 00:00:00", "2023-01-02 00:00:00"], utc=True),
            "city": ["Lahore", "Lahore"],
            "sensor_id": ["s1", "s1"],
            "latitude": [31.52, 31.52],
            "longitude": [74.35, 74.35],
            "pm25": [50.0, 75.0]
        })
        gold = self.builder.construct_forecasting_target(df_sample, horizon_hours=24)
        self.assertEqual(len(gold), 1)
        self.assertIn("record_id", gold.columns)
        self.assertEqual(gold.iloc[0]["pm25_target_24h"], 75.0)
        self.assertEqual(gold.iloc[0]["pm25_baseline_persistence"], 50.0)


if __name__ == "__main__":
    unittest.main()
