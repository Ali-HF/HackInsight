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
        """Verify reshape_to_long_format interface signature."""
        df_sample = pd.DataFrame({"datetime": ["2024-01-01 00:00:00"], "s1": [45.0]})
        meta_sample = pd.DataFrame({"sensor_id": ["s1"], "city": ["Lahore"]})
        with self.assertRaises(NotImplementedError):
            self.cleaner.reshape_to_long_format(df_sample, meta_sample)

    def test_validator_contract(self):
        """Verify evaluate_check interface signature."""
        df_sample = pd.DataFrame({"pm25": [12.0, -9999.0]})
        with self.assertRaises(NotImplementedError):
            self.validator.evaluate_check(df_sample, "pm25", "range", 1000.0)

    def test_gold_builder_contract(self):
        """Verify construct_forecasting_target interface signature."""
        df_sample = pd.DataFrame({
            "timestamp_utc": ["2024-01-01 00:00:00"],
            "city": ["Lahore"],
            "sensor_id": ["s1"],
            "pm25": [50.0]
        })
        with self.assertRaises(NotImplementedError):
            self.builder.construct_forecasting_target(df_sample, horizon_hours=24)


if __name__ == "__main__":
    unittest.main()
