"""
Insight / RAG Agent Core.
HackInsight 2026 - Member 3: Insight / RAG Agent.

Architecture:
User Question
      |
Insight / RAG Agent
      |
Intent Routing & Tool Selection
      |
  +-> Current PM2.5 (Gold data)
  +-> Historical PM2.5 (Gold records)
  +-> 24h ML Forecast (predict_pm25_24h)
  +-> Model Performance Metrics (ML artifacts)
  +-> Data Quality Status (DQ Agent logs)
      |
Evidence Bundle Creation
      |
Grounding & Citations Enforcement (WHO / Pak-NEQS / Punjab EPA)
      |
Answer Synthesis (or deterministic "I don't know")
      |
Audit Trail Recording
"""

from typing import Dict, Any, List, Optional
import uuid
import re

from src.agent_tools.current_pm25 import get_current_pm25
from src.agent_tools.historical_pm25 import get_historical_pm25
from src.agent_tools.forecast_tool import get_pm25_forecast
from src.agent_tools.model_metrics import get_model_metrics
from src.agent_tools.quality_tool import get_data_quality_status

from src.insight_agent.audit import AuditTrail, AuditStep
from src.insight_agent.grounding import EvidenceBundle, GroundingEngine, AUTHORITATIVE_STANDARDS


class InsightRAGAgent:
    """
    Autonomous Insight & RAG Agent for environmental decision support.
    Strictly answers from retrieved deterministic evidence and states 'I don't know'
    when data or evidence is unavailable.
    """

    SUPPORTED_CITIES = ["Lahore", "Karachi"]

    def __init__(self, audit_trail: Optional[AuditTrail] = None):
        self.audit = audit_trail or AuditTrail()

    def _extract_city(self, question: str) -> Optional[str]:
        """Identify mentioned city in query."""
        q_lower = question.lower()
        if "lahore" in q_lower:
            return "Lahore"
        if "karachi" in q_lower:
            return "Karachi"
        # Check for unmentioned unsupported cities
        for city in ["islamabad", "peshawar", "quetta", "rawalpindi", "multan", "faisalabad"]:
            if city in q_lower:
                return city.capitalize()
        return None

    def _determine_tools(self, question: str) -> List[str]:
        """Detect query intent and map to required tools."""
        q = question.lower()
        tools = []

        if any(w in q for w in ["forecast", "tomorrow", "predict", "future", "ahead", "24h"]):
            tools.append("forecast_tool")
        if any(w in q for w in ["current", "now", "latest", "present", "today"]):
            tools.append("current_pm25")
        if any(w in q for w in ["history", "past", "yesterday", "trend", "trended", "previous"]):
            tools.append("historical_pm25")
        if any(w in q for w in ["metric", "accuracy", "mae", "rmse", "baseline", "performance", "how accurate", "error"]):
            tools.append("model_metrics")
        if any(w in q for w in ["quality", "reliable", "reliability", "valid", "warning", "flag", "dq", "checks"]):
            tools.append("quality_tool")

        # If question is general about air quality or smog without explicit tool, check current + forecast
        if not tools:
            if any(w in q for w in ["air quality", "pm2.5", "smog", "pollution"]):
                tools = ["current_pm25", "forecast_tool"]

        return tools

    def answer_question(self, question: str) -> Dict[str, Any]:
        """
        Main entrypoint: Decides tools, retrieves evidence, applies grounding rules,
        and generates cited response.
        """
        interaction_id = str(uuid.uuid4())[:8]
        steps: List[AuditStep] = []
        city = self._extract_city(question)

        # 1. Scope / City validation ("I don't know" rule for unsupported cities)
        if city and city not in self.SUPPORTED_CITIES:
            answer = f"I don't know. {city} is not currently supported by the available sensor network and forecasting data. Supported cities are: {', '.join(self.SUPPORTED_CITIES)}."
            step_unsupp = AuditStep(
                step_id=1,
                step_type="intent_routing",
                details={"city": city, "supported": False, "reason": "unsupported_city"}
            )
            self.audit.create_record(
                interaction_id=interaction_id,
                question=question,
                selected_tools=[],
                tool_inputs={"city": city},
                evidence_retrieved={},
                warnings_flags=["UNSUPPORTED_CITY"],
                grounding_passed=True,
                final_answer=answer,
                steps=[step_unsupp]
            )
            return {
                "status": "unsupported",
                "question": question,
                "answer": answer,
                "city": city,
                "evidence": {},
                "citations": [],
                "warnings": [f"City '{city}' is unsupported."],
                "tools_used": [],
                "interaction_id": interaction_id
            }

        # 2. Tool Selection
        tools = self._determine_tools(question)
        steps.append(AuditStep(
            step_id=len(steps) + 1,
            step_type="intent_routing",
            details={"city": city, "selected_tools": tools}
        ))

        # Handle questions outside project scope
        if not tools and not city:
            answer = "I don't know. The query falls outside the scope of PM2.5 air quality monitoring, forecasting, and data quality validation."
            self.audit.create_record(
                interaction_id=interaction_id,
                question=question,
                selected_tools=[],
                tool_inputs={},
                evidence_retrieved={},
                warnings_flags=["OUT_OF_SCOPE"],
                grounding_passed=True,
                final_answer=answer,
                steps=steps
            )
            return {
                "status": "out_of_scope",
                "question": question,
                "answer": answer,
                "city": None,
                "evidence": {},
                "citations": [],
                "warnings": ["Out of domain scope."],
                "tools_used": [],
                "interaction_id": interaction_id
            }

        # 3. Evidence Collection
        evidence = EvidenceBundle(city=city)
        citations = []
        warnings = []
        target_city = city or "Lahore"

        if "current_pm25" in tools:
            curr_res = get_current_pm25(target_city)
            steps.append(AuditStep(step_id=len(steps) + 1, step_type="tool_call", details={"tool": "current_pm25", "result": curr_res}))
            if curr_res["status"] == "success":
                evidence.current_pm25 = curr_res["pm25"]
                evidence.current_timestamp = curr_res["timestamp_utc"]
                evidence.current_record_id = curr_res.get("record_id")
                evidence.sensor_id = curr_res.get("sensor_id")
                evidence.sources.append(curr_res.get("source", "Gold Data"))

        if "historical_pm25" in tools:
            hist_res = get_historical_pm25(target_city, limit=10)
            steps.append(AuditStep(step_id=len(steps) + 1, step_type="tool_call", details={"tool": "historical_pm25", "result": hist_res}))
            if hist_res["status"] == "success":
                evidence.sources.append(hist_res["summary"].get("source", "Historical Gold Data"))

        if "forecast_tool" in tools:
            fore_res = get_pm25_forecast(target_city)
            steps.append(AuditStep(step_id=len(steps) + 1, step_type="tool_call", details={"tool": "forecast_tool", "result": fore_res}))
            if fore_res["status"] == "success":
                evidence.forecast_pm25 = fore_res["predicted_pm25_24h"]
                evidence.forecast_lower_80 = fore_res.get("lower_80")
                evidence.forecast_upper_80 = fore_res.get("upper_80")
                evidence.forecast_issue_time = fore_res.get("forecast_issue_time")
                evidence.forecast_target_time = fore_res.get("forecast_target_time")
                evidence.baseline_persistence = fore_res.get("baseline_persistence")
                evidence.sources.append("Member 2 PM2.5 Forecaster (HistGradientBoosting)")
            else:
                warnings.append(f"Forecast unavailable: {fore_res.get('message')}")

        if "model_metrics" in tools:
            met_res = get_model_metrics(city=city)
            steps.append(AuditStep(step_id=len(steps) + 1, step_type="tool_call", details={"tool": "model_metrics", "result": met_res}))
            if met_res["status"] == "success":
                evidence.model_mae = met_res.get("model_mae")
                evidence.model_rmse = met_res.get("model_rmse")
                evidence.baseline_mae = met_res.get("baseline_mae")
                evidence.uncertainty_coverage_80 = met_res.get("uncertainty_coverage_80")
                evidence.sources.append("ML Evaluation Report (artifacts/reports/metrics_summary.json)")

        if "quality_tool" in tools or "forecast_tool" in tools:
            dq_res = get_data_quality_status(city=city)
            steps.append(AuditStep(step_id=len(steps) + 1, step_type="tool_call", details={"tool": "quality_tool", "result": dq_res}))
            if dq_res["status"] == "success":
                evidence.quality_status = dq_res.get("overall_status")
                evidence.quality_warnings = dq_res.get("warnings", [])
                warnings.extend(evidence.quality_warnings)
                evidence.sources.append("Data Quality Agent Audit Log (reports/data_quality/)")

        # Fallback if no valid evidence could be retrieved
        if not evidence.to_dict():
            answer = f"I don't know. Unable to retrieve verified evidence for {target_city} from the system tools."
            self.audit.create_record(
                interaction_id=interaction_id,
                question=question,
                selected_tools=tools,
                tool_inputs={"city": target_city},
                evidence_retrieved={},
                warnings_flags=["MISSING_EVIDENCE"],
                grounding_passed=True,
                final_answer=answer,
                steps=steps
            )
            return {
                "status": "missing_evidence",
                "question": question,
                "answer": answer,
                "city": target_city,
                "evidence": {},
                "citations": [],
                "warnings": ["Insufficient evidence to formulate answer."],
                "tools_used": tools,
                "interaction_id": interaction_id
            }

        # 4. Construct Grounded Response
        answer_parts = []
        if evidence.current_pm25 is not None:
            answer_parts.append(f"The latest observed PM2.5 in {target_city} is {evidence.current_pm25} µg/m³.")
        
        if evidence.forecast_pm25 is not None:
            answer_parts.append(
                f"The 24-hour predicted PM2.5 for {target_city} is {evidence.forecast_pm25} µg/m³ "
                f"(80% prediction interval: [{evidence.forecast_lower_80}, {evidence.forecast_upper_80}] µg/m³, "
                f"persistence baseline: {evidence.baseline_persistence} µg/m³)."
            )
            # Add advisory context if air quality exceeds standard
            if evidence.forecast_pm25 > 150.0:
                answer_parts.append("Levels exceed the Punjab Smog Action Plan threshold (150 µg/m³). Outdoor exposure should be minimized.")
                citations.append(AUTHORITATIVE_STANDARDS["PUNJAB_EPD_SMOG_POLICY"])
            elif evidence.forecast_pm25 > 35.0:
                answer_parts.append("Concentrations exceed Pakistan Ambient Air Quality Standards (35 µg/m³ 24h limit).")
                citations.append(AUTHORITATIVE_STANDARDS["PAK_NEQS_2010"])
            else:
                citations.append(AUTHORITATIVE_STANDARDS["WHO_AQG_2021"])

        if evidence.model_mae is not None:
            ans_str = f"The forecaster achieves a test MAE of {evidence.model_mae} µg/m³"
            if evidence.baseline_mae is not None:
                ans_str += f" (beating the persistence baseline of {evidence.baseline_mae} µg/m³)"
            if evidence.uncertainty_coverage_80 is not None:
                ans_str += f" with {evidence.uncertainty_coverage_80}% empirical 80%-interval coverage"
            ans_str += "."
            answer_parts.append(ans_str)

        if "quality_tool" in tools and evidence.quality_status:
            answer_parts.append(f"Data quality status is {evidence.quality_status}.")
            if evidence.quality_warnings:
                answer_parts.append(f"Noted quality warnings: {'; '.join(evidence.quality_warnings[:2])}.")

        final_answer = " ".join(answer_parts) if answer_parts else f"Observations retrieved for {target_city}."

        # 5. Verify Grounding
        grounding_ok = GroundingEngine.verify_numbers(final_answer, evidence)

        # 6. Audit Trail Recording
        evidence_dict = evidence.to_dict()
        self.audit.create_record(
            interaction_id=interaction_id,
            question=question,
            selected_tools=tools,
            tool_inputs={"city": target_city},
            evidence_retrieved=evidence_dict,
            warnings_flags=warnings,
            grounding_passed=grounding_ok,
            final_answer=final_answer,
            steps=steps
        )

        return {
            "status": "success",
            "question": question,
            "answer": final_answer,
            "city": target_city,
            "evidence": evidence_dict,
            "citations": citations,
            "warnings": warnings,
            "tools_used": tools,
            "grounding_passed": grounding_ok,
            "interaction_id": interaction_id
        }
