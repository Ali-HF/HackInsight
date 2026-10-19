"""
Tests for ML Forecast Tool.
HackInsight 2026 - Member 3: Insight / RAG Agent.
"""

import pytest
import pandas as pd
from src.agent_tools.forecast_tool import get_pm25_forecast


def test_forecast_tool_lahore():
    result = get_pm25_forecast("Lahore")
    assert result["status"] == "success"
    assert result["city"] == "Lahore"
    assert result["predicted_pm25_24h"] is not None
    assert result["predicted_pm25_24h"] > 0
    assert "lower_80" in result
    assert "upper_80" in result
    assert result["lower_80"] <= result["predicted_pm25_24h"] <= result["upper_80"]


def test_forecast_tool_karachi():
    result = get_pm25_forecast("Karachi")
    assert result["status"] == "success"
    assert result["city"] == "Karachi"
    assert result["predicted_pm25_24h"] is not None


def test_forecast_tool_unsupported_city():
    result = get_pm25_forecast("Quetta")
    assert result["status"] == "unsupported_city"
    assert result["forecast"] is None
    assert "not supported" in result["message"]
