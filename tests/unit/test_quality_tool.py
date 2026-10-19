"""
Tests for Data Quality Tool Integration.
HackInsight 2026 - Member 3: Insight / RAG Agent.
"""

import pytest
from src.agent_tools.quality_tool import get_data_quality_status


def test_get_data_quality_status_overall():
    result = get_data_quality_status()
    assert result["status"] == "success"
    assert result["overall_status"] in ["PASS", "WARN", "FAIL"]
    assert result["checks_run"] > 0
    assert "actions_summary" in result
    assert isinstance(result["warnings"], list)


def test_get_data_quality_status_specific_rule():
    result = get_data_quality_status(rule_id="DQ-SCH-001")
    assert result["status"] == "success"
    assert result["rule_id"] == "DQ-SCH-001"
    assert result["action"] == "NO_ACTION"


def test_get_data_quality_status_missing_rule():
    result = get_data_quality_status(rule_id="DQ-NONEXISTENT")
    assert result["status"] == "not_found"
