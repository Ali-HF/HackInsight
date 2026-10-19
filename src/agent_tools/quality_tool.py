"""
Data Quality Integration Tool.
HackInsight 2026 - Member 3: Insight / RAG Agent.

Provides an agent-facing interface to query the Data Quality Agent's reports,
flags, warnings, and validation decisions.
"""

from typing import Dict, Any, Optional, List
from pathlib import Path
import json
import pandas as pd


def get_data_quality_status(
    city: Optional[str] = None,
    rule_id: Optional[str] = None,
    report_path: Optional[str] = None,
    log_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Retrieve authoritative data quality status and validation audit decisions.

    Args:
        city: Optional city to check quality context for.
        rule_id: Optional specific rule ID to query (e.g. 'DQ-SCH-001', 'DQ-STALE-001').
        report_path: Optional path to agent_quality_assessment.json.
        log_path: Optional path to quality_log.csv.

    Returns:
        Dict with overall quality status (PASS / WARN / FAIL), flags, warnings, and audit trail.
    """
    base_dir = Path(__file__).resolve().parent.parent.parent
    assessment_file = Path(report_path) if report_path else base_dir / "reports" / "data_quality" / "agent_quality_assessment.json"
    csv_file = Path(log_path) if log_path else base_dir / "reports" / "data_quality" / "quality_log.csv"

    if not assessment_file.is_file():
        return {
            "status": "error",
            "is_valid": False,
            "overall_status": "UNKNOWN",
            "warnings": ["Data quality assessment report not found."],
            "message": "Data quality assessment report not available."
        }

    try:
        with open(assessment_file, "r", encoding="utf-8") as f:
            assessment = json.load(f)
    except Exception as exc:
        return {
            "status": "error",
            "is_valid": False,
            "overall_status": "ERROR",
            "warnings": [f"Error reading quality report: {str(exc)}"],
            "message": "Failed reading data quality report."
        }

    overall_status = assessment.get("overall_status", "UNKNOWN")
    decisions = assessment.get("decisions", [])
    actions_summary = assessment.get("actions_summary", {})

    flagged_rules = [d for d in decisions if d.get("action") == "FLAG"]
    warnings = [f"[{d.get('rule_id')}] {d.get('rationale')}" for d in flagged_rules]

    # Specific rule lookup
    if rule_id:
        matched = [d for d in decisions if d.get("rule_id") == rule_id]
        if not matched:
            return {
                "status": "not_found",
                "rule_id": rule_id,
                "message": f"Rule {rule_id} not found in quality assessment."
            }
        dec = matched[0]
        return {
            "status": "success",
            "rule_id": rule_id,
            "action": dec.get("action"),
            "severity": dec.get("severity"),
            "records_affected": dec.get("records_affected"),
            "rationale": dec.get("rationale"),
            "timestamp_utc": dec.get("timestamp_utc"),
            "message": f"Rule {rule_id}: action={dec.get('action')} ({dec.get('rationale')})"
        }

    # High-level assessment
    has_critical_fail = any(d.get("severity") == "critical" and d.get("action") == "FLAG" for d in decisions)
    is_valid = not has_critical_fail

    summary_msg = (
        f"Data Quality Status: {overall_status}. "
        f"Checks run: {assessment.get('checks_run')}, "
        f"Flags: {actions_summary.get('FLAG', 0)}, "
        f"Records checked: {assessment.get('total_records_checked')}."
    )
    if warnings:
        summary_msg += f" Quality warnings: {'; '.join(warnings[:2])}."

    return {
        "status": "success",
        "city": city,
        "is_valid": is_valid,
        "overall_status": overall_status,
        "checks_run": assessment.get("checks_run"),
        "total_records_checked": assessment.get("total_records_checked"),
        "records_affected_total": assessment.get("records_affected_total"),
        "actions_summary": actions_summary,
        "flag_count": len(flagged_rules),
        "warnings": warnings,
        "message": summary_msg
    }
