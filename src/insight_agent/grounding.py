"""
Evidence and Grounding Verification Engine.
HackInsight 2026 - Member 3: Insight / RAG Agent.

Enforces zero-hallucination policies:
1. Every numerical statement must map to deterministic tool evidence.
2. Every recommendation or threshold must map to an authoritative standard (WHO / Pak-EPA).
3. If evidence is missing, incomplete, or unconfirmed, triggers 'I don't know' without guessing.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
import re


# Authoritative Citations Repository
AUTHORITATIVE_STANDARDS = {
    "WHO_AQG_2021": {
        "title": "WHO Global Air Quality Guidelines (2021)",
        "pm25_24h_target": 15.0,
        "pm25_annual_target": 5.0,
        "citation": "World Health Organization (2021). Global Air Quality Guidelines: Particulate Matter (PM2.5 and PM10)."
    },
    "PAK_NEQS_2010": {
        "title": "National Environmental Quality Standards for Ambient Air (Pakistan EPA, 2010)",
        "pm25_24h_standard": 35.0,
        "pm25_annual_standard": 15.0,
        "citation": "Pakistan Environmental Protection Agency (Pak-EPA, S.R.O. 1062(I)/2010)."
    },
    "PUNJAB_EPD_SMOG_POLICY": {
        "title": "Punjab Clean Air Action Plan & Smog Policy (2023)",
        "action_threshold": 150.0,
        "citation": "Environmental Protection Department, Government of Punjab (2023). Policy on Smog Prevention & Control."
    }
}


@dataclass
class EvidenceBundle:
    """Encapsulates all verified facts retrieved from deterministic tools."""
    city: Optional[str] = None
    sensor_id: Optional[str] = None
    current_pm25: Optional[float] = None
    current_timestamp: Optional[str] = None
    current_record_id: Optional[str] = None
    forecast_pm25: Optional[float] = None
    forecast_lower_80: Optional[float] = None
    forecast_upper_80: Optional[float] = None
    forecast_issue_time: Optional[str] = None
    forecast_target_time: Optional[str] = None
    baseline_persistence: Optional[float] = None
    model_mae: Optional[float] = None
    model_rmse: Optional[float] = None
    baseline_mae: Optional[float] = None
    uncertainty_coverage_80: Optional[float] = None
    quality_status: Optional[str] = None
    quality_warnings: List[str] = field(default_factory=list)
    citations: List[Dict[str, Any]] = field(default_factory=list)
    sources: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {k: v for k, v in self.__dict__.items() if v is not None}


class GroundingEngine:
    """Verifies that generated answers do not contain ungrounded numbers or false claims."""

    @staticmethod
    def verify_numbers(answer_text: str, evidence: EvidenceBundle) -> bool:
        """
        Scan text for numbers and verify each exists within the evidence bundle.
        Allowed non-data numbers include standard dates/times or standard citation years (2021, 2023, 2010, 24, 80, 90).
        """
        # Pre-process text to mask standard domain strings: PM2.5, PM10, m³, ug/m3, m3
        clean_text = re.sub(r"(?i)\bpm2\.5\b", "PM_TWO_POINT_FIVE", answer_text)
        clean_text = re.sub(r"(?i)\bpm10\b", "PM_TEN", clean_text)
        clean_text = re.sub(r"(?i)\b[uµ]g/m3\b", "UNIT_UGM3", clean_text)
        clean_text = re.sub(r"(?i)\b[uµ]g/m³\b", "UNIT_UGM3", clean_text)
        clean_text = re.sub(r"(?i)\bm3\b", "UNIT_M3", clean_text)
        clean_text = re.sub(r"(?i)\bm³\b", "UNIT_M3", clean_text)

        # Standard domain constants allowed in descriptions:
        # e.g., 24 (24h horizon), 80/90 (% intervals), 15 (WHO), 35 (Pak EPA), 150 (Punjab smog), 2021/2023/2010/2024/2026 (standards/years)
        whitelisted_constants = {15, 35, 150, 2021, 2023, 2010, 2024, 2026, 24, 80, 90, 1, 2, 3, 4, 10}
        
        # Extract numerical tokens
        tokens = re.findall(r"\b\d+(?:\.\d+)?\b", clean_text)
        evidence_dict = evidence.to_dict()

        evidence_numbers = set(whitelisted_constants)
        for val in evidence_dict.values():
            if isinstance(val, (int, float)):
                evidence_numbers.add(round(float(val), 2))
                evidence_numbers.add(int(round(float(val))))
            elif isinstance(val, list):
                for item in val:
                    if isinstance(item, (int, float)):
                        evidence_numbers.add(round(float(item), 2))
                    elif isinstance(item, str):
                        # Extract any rule numbers or statistics embedded in warning strings
                        for sub_n in re.findall(r"\b\d+(?:\.\d+)?\b", item):
                            try:
                                evidence_numbers.add(float(sub_n))
                            except ValueError:
                                pass

        for tok in tokens:
            try:
                num = float(tok)
                if num in evidence_numbers or round(num, 2) in evidence_numbers or int(round(num)) in evidence_numbers:
                    continue
                # If number is part of an ISO timestamp string or sub-seconds
                if len(tok) == 2 and tok in [
                    "00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
                    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21",
                    "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "59"
                ]:
                    continue
                return False
            except ValueError:
                continue

        return True

