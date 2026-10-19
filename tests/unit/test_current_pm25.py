"""
Tests for Current PM2.5 Retrieval Tool.
HackInsight 2026 - Member 3: Insight / RAG Agent.
"""

import pytest
import pandas as pd
from pathlib import Path
from src.agent_tools.current_pm25 import get_current_pm25


def test_get_current_pm25_lahore(tmp_path):
    # Test using real prediction dataset
    result = get_current_pm25("Lahore")
    assert result["status"] == "success"
    assert result["city"] == "Lahore"
    assert result["pm25"] is not None
    assert result["pm25"] > 0
    assert result["unit"] == "ug/m3"
    assert "timestamp_utc" in result


def test_get_current_pm25_karachi():
    result = get_current_pm25("karachi")
    assert result["status"] == "success"
    assert result["city"] == "Karachi"
    assert result["pm25"] is not None


def test_get_current_pm25_unsupported_city():
    result = get_current_pm25("Islamabad")
    assert result["status"] == "unsupported_city"
    assert result["pm25"] is None
    assert "not currently supported" in result["message"]


def test_get_current_pm25_custom_file(tmp_path):
    dummy_csv = tmp_path / "custom_obs.csv"
    df = pd.DataFrame([
        {"record_id": "rec_01", "timestamp_utc": "2024-01-01 10:00:00+00:00", "city": "Lahore", "sensor_id": "sensor_x", "pm25": 142.5},
        {"record_id": "rec_02", "timestamp_utc": "2024-01-01 11:00:00+00:00", "city": "Lahore", "sensor_id": "sensor_x", "pm25": 155.0},
    ])
    df.to_csv(dummy_csv, index=False)

    result = get_current_pm25("Lahore", data_path=str(dummy_csv))
    assert result["status"] == "success"
    assert result["pm25"] == 155.0
    assert result["record_id"] == "rec_02"
