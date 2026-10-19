"""
Tests for Historical PM2.5 Retrieval Tool.
HackInsight 2026 - Member 3: Insight / RAG Agent.
"""

import pytest
import pandas as pd
from pathlib import Path
from src.agent_tools.historical_pm25 import get_historical_pm25


def test_get_historical_pm25_lahore():
    result = get_historical_pm25("Lahore", limit=10)
    assert result["status"] == "success"
    assert result["city"] == "Lahore"
    assert result["count"] > 0
    assert len(result["observations"]) == result["count"]
    assert "mean_pm25" in result["summary"]


def test_get_historical_pm25_time_filtering():
    result = get_historical_pm25("Lahore", start_time="2024-07-23 00:00:00", end_time="2024-07-24 00:00:00")
    assert result["status"] in ["success", "empty"]
    if result["status"] == "success":
        for obs in result["observations"]:
            assert "2024-07-23" in obs["timestamp_utc"] or "2024-07-24" in obs["timestamp_utc"]


def test_get_historical_pm25_unsupported_city():
    result = get_historical_pm25("Peshawar")
    assert result["status"] == "unsupported_city"
    assert result["count"] == 0
    assert "not supported" in result["message"]
