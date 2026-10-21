"""
Unit tests for Station Licensing & Provenance Ledger.
HackInsight 2026 - Legal Compliance and Data Governance.
"""

import unittest
from pathlib import Path
import pandas as pd

from src.data_pipeline.provenance.station_ledger import (
    load_station_license_ledger,
    get_verified_station_ids,
    filter_verified_stations
)


class TestStationLicenseLedger(unittest.TestCase):
    """Verifies that all stations have legal provenance and unverified sensors are excluded."""

    def test_load_station_license_ledger(self):
        ledger = load_station_license_ledger()
        self.assertIn("stations", ledger)
        self.assertEqual(len(ledger["stations"]), 30)
        self.assertEqual(ledger["verified_count"], 30)

    def test_get_verified_station_ids(self):
        verified_ids = get_verified_station_ids()
        self.assertEqual(len(verified_ids), 30)
        # Check known Karachi & Lahore stations
        self.assertIn("212607b3f328c11e", verified_ids)
        self.assertIn("0166919645da6ef4", verified_ids)

    def test_filter_verified_stations_excludes_unverified(self):
        df = pd.DataFrame({
            "sensor_id": ["212607b3f328c11e", "UNVERIFIED_ROGUE_SENSOR_99"],
            "pm25": [45.0, 120.0]
        })
        filtered = filter_verified_stations(df)
        self.assertEqual(len(filtered), 1)
        self.assertEqual(filtered.iloc[0]["sensor_id"], "212607b3f328c11e")


if __name__ == "__main__":
    unittest.main()
