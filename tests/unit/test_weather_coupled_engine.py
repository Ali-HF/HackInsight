"""
Unit Tests for Weather-Coupled Dynamic PM2.5 Forecasting Engine.
HackInsight 2026 - Real-time meteorology & dynamic air quality prediction.
"""

import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path
import json
import pandas as pd

from src.ml_pipeline.weather_coupled_engine import WeatherCoupledEngine, CITY_COORDINATES


class TestWeatherCoupledEngine(unittest.TestCase):
    """Test suite for live meteorology ingestion and dynamic air quality prediction."""

    @classmethod
    def setUpClass(cls):
        cls.engine = WeatherCoupledEngine(retrain_if_missing=True)

    def test_city_coordinates_defined(self):
        """Verify coordinates and metadata exist for supported cities."""
        self.assertIn("Lahore", CITY_COORDINATES)
        self.assertIn("Karachi", CITY_COORDINATES)
        self.assertEqual(CITY_COORDINATES["Lahore"]["is_lahore"], 1)
        self.assertEqual(CITY_COORDINATES["Karachi"]["is_lahore"], 0)

    @patch("src.ml_pipeline.weather_coupled_engine.requests.get")
    def test_generate_city_forecast_lahore(self, mock_get):
        """Verify city forecast generation with mocked Open-Meteo payload."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "current": {
                "time": "2026-10-21T15:00",
                "temperature_2m": 24.5,
                "relative_humidity_2m": 72.0,
                "surface_pressure": 1012.0,
                "wind_speed_10m": 6.5,
                "dew_point_2m": 19.0,
                "precipitation": 0.0
            },
            "hourly": {
                "time": [f"2026-10-21T{h:02d}:00" for h in range(48)],
                "temperature_2m": [24.0 + (h % 5) for h in range(48)],
                "relative_humidity_2m": [70.0 + (h % 10) for h in range(48)],
                "surface_pressure": [1012.0 for _ in range(48)],
                "wind_speed_10m": [6.0 + (h % 3) for h in range(48)],
                "dew_point_2m": [18.0 for _ in range(48)],
                "precipitation": [0.0 for _ in range(48)]
            }
        }
        mock_get.return_value = mock_resp

        res = self.engine.generate_city_forecast("Lahore")
        self.assertEqual(res["city"], "Lahore")
        self.assertGreater(res["current_pm25"], 0)
        self.assertGreater(res["predicted_pm25_24h"], 0)
        self.assertLessEqual(res["lower_80"], res["predicted_pm25_24h"])
        self.assertGreaterEqual(res["upper_80"], res["predicted_pm25_24h"])
        self.assertEqual(len(res["trajectory_24h"]), 24)
        self.assertEqual(len(res["history"]), 24)

    @patch("src.ml_pipeline.weather_coupled_engine.requests.get")
    def test_generate_city_forecast_karachi(self, mock_get):
        """Verify Karachi forecast produces coastal-ventilated predictions."""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "current": {
                "time": "2026-10-21T15:00",
                "temperature_2m": 28.0,
                "relative_humidity_2m": 82.0,
                "surface_pressure": 1010.0,
                "wind_speed_10m": 7.5,
                "dew_point_2m": 24.5,
                "precipitation": 0.0
            },
            "hourly": {
                "time": [f"2026-10-21T{h:02d}:00" for h in range(48)],
                "temperature_2m": [27.0 + (h % 3) for h in range(48)],
                "relative_humidity_2m": [80.0 for _ in range(48)],
                "surface_pressure": [1010.0 for _ in range(48)],
                "wind_speed_10m": [7.0 for _ in range(48)],
                "dew_point_2m": [24.0 for _ in range(48)],
                "precipitation": [0.0 for _ in range(48)]
            }
        }
        mock_get.return_value = mock_resp

        res = self.engine.generate_city_forecast("Karachi")
        self.assertEqual(res["city"], "Karachi")
        self.assertGreater(res["current_pm25"], 0)
        self.assertGreater(res["predicted_pm25_24h"], 0)


if __name__ == "__main__":
    unittest.main()
