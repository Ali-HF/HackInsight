"""
Tests for Model Metrics Retrieval Tool.
HackInsight 2026 - Member 3: Insight / RAG Agent.
"""

import pytest
from src.agent_tools.model_metrics import get_model_metrics


def test_get_overall_metrics():
    result = get_model_metrics()
    assert result["status"] == "success"
    assert result["model_mae"] == 40.602
    assert result["baseline_mae"] == 42.347
    assert result["beats_baseline"] is True
    assert result["uncertainty_coverage_80"] == 82.43


def test_get_city_metrics_lahore():
    result = get_model_metrics(city="Lahore")
    assert result["status"] == "success"
    assert result["city"] == "Lahore"
    assert result["model_mae"] == 49.384
    assert result["baseline_mae"] == 51.491


def test_get_city_metrics_karachi():
    result = get_model_metrics(city="Karachi")
    assert result["status"] == "success"
    assert result["city"] == "Karachi"
    assert result["model_mae"] == 13.935


def test_get_city_metrics_unsupported():
    result = get_model_metrics(city="Multan")
    assert result["status"] == "unsupported_city"
    assert result["metrics"] is None
