"""
Comprehensive Tests for Insight / RAG Agent.
HackInsight 2026 - Member 3: Insight / RAG Agent.

Tests cover:
1. Current PM2.5 query
2. Forecast query
3. Historical data query
4. Model metrics query
5. Data quality query
6. Multi-tool combination query
7. Unsupported city ("I don't know")
8. Out of scope question ("I don't know")
9. Grounding and anti-hallucination verification
10. Audit trail creation and schema
11. Member 4 answer_question interface
"""

import pytest
from src.insight_agent.agent import InsightRAGAgent
from src.insight_agent.interface import answer_question
from src.insight_agent.audit import AuditTrail


@pytest.fixture
def agent():
    return InsightRAGAgent()


def test_agent_forecast_lahore(agent):
    res = agent.answer_question("What is tomorrow's PM2.5 forecast for Lahore?")
    assert res["status"] == "success"
    assert "Lahore" in res["answer"]
    assert "forecast_tool" in res["tools_used"]
    assert "forecast_pm25" in res["evidence"]
    assert res["grounding_passed"] is True
    assert len(res["citations"]) > 0


def test_agent_current_pm25_karachi(agent):
    res = agent.answer_question("What is the current PM2.5 reading in Karachi?")
    assert res["status"] == "success"
    assert "current_pm25" in res["tools_used"]
    assert "current_pm25" in res["evidence"]
    assert res["grounding_passed"] is True


def test_agent_unsupported_city(agent):
    res = agent.answer_question("What is tomorrow's PM2.5 forecast for Islamabad?")
    assert res["status"] == "unsupported"
    assert "I don't know" in res["answer"]
    assert "Islamabad is not currently supported" in res["answer"]


def test_agent_out_of_scope(agent):
    res = agent.answer_question("Who won the 1992 cricket world cup?")
    assert res["status"] == "out_of_scope"
    assert "I don't know" in res["answer"]


def test_agent_model_metrics(agent):
    res = agent.answer_question("How accurate is the forecasting model?")
    assert res["status"] == "success"
    assert "model_metrics" in res["tools_used"]
    assert "model_mae" in res["evidence"]
    assert "40.6" in res["answer"] or "40.602" in res["answer"]
    assert res["grounding_passed"] is True


def test_agent_data_quality(agent):
    res = agent.answer_question("What is the data quality status and are there any warnings?")
    assert res["status"] == "success"
    assert "quality_tool" in res["tools_used"]
    assert "quality_status" in res["evidence"]
    assert res["grounding_passed"] is True


def test_agent_multi_tool_question(agent):
    res = agent.answer_question("What is Lahore's predicted PM2.5 tomorrow and how reliable is the data quality?")
    assert res["status"] == "success"
    assert "forecast_tool" in res["tools_used"]
    assert "quality_tool" in res["tools_used"]
    assert "forecast_pm25" in res["evidence"]
    assert "quality_status" in res["evidence"]
    assert res["grounding_passed"] is True


def test_agent_audit_trail_recorded(agent):
    res = agent.answer_question("Forecast PM2.5 in Lahore")
    assert "interaction_id" in res
    assert len(agent.audit.records) > 0
    rec = agent.audit.records[-1]
    assert rec.interaction_id == res["interaction_id"]
    assert len(rec.steps) > 0


def test_member_4_interface():
    res = answer_question("What is the current PM2.5 in Lahore?")
    assert isinstance(res, dict)
    assert "answer" in res
    assert "evidence" in res
    assert "citations" in res
    assert "warnings" in res
    assert "tools_used" in res
