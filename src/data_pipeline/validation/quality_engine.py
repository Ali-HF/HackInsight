"""
Deterministic Validation Engine & Data Quality Agent Tools.
HackInsight 2026 - Member 1: Data Engineering.

Responsibilities:
1. Provide deterministic validation checks (schema, missingness, ranges, timestamps).
2. Interface directly with Member 3's Data Quality Agent via standard action dispatch:
   - FIX: safe, deterministic correction (e.g., unit or format conversions).
   - FILL: defensible imputation, strictly marked in quality metadata.
   - FLAG: retain record, flag uncertainty/anomaly in audit table.
3. Generate machine-readable JSON quality reports and audit logs.
"""

from typing import Dict, Any, List, Optional
from pathlib import Path
from enum import Enum
from datetime import datetime, timezone
import json
import csv
import pandas as pd
import numpy as np


class ActionType(str, Enum):
    """Permitted action types for Data Quality Agent."""
    FIX = "FIX"
    FILL = "FILL"
    FLAG = "FLAG"
    NO_ACTION = "NO_ACTION"


class ValidationEngine:
    """Deterministic validation runner producing structured findings for the Data Quality Agent."""

    def __init__(self, quality_log_path: Path):
        """
        Initialize the validation engine.

        Args:
            quality_log_path: Path to write the persistent quality_log.csv audit trail.
        """
        self.quality_log_path = Path(quality_log_path)
        self.quality_log_path.parent.mkdir(parents=True, exist_ok=True)
        self.log_fieldnames = [
            "timestamp_utc",
            "rule_id",
            "action",
            "records_checked",
            "records_affected",
            "severity",
            "rationale"
        ]

    def log_decision(
        self,
        rule_id: str,
        action: ActionType,
        records_checked: int,
        records_affected: int,
        severity: str,
        rationale: str
    ) -> Dict[str, Any]:
        """
        Append an auditable decision to quality_log.csv.
        """
        write_header = not self.quality_log_path.exists() or self.quality_log_path.stat().st_size == 0
        entry = {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "rule_id": rule_id,
            "action": action.value if isinstance(action, ActionType) else str(action),
            "records_checked": int(records_checked),
            "records_affected": int(records_affected),
            "severity": severity,
            "rationale": rationale
        }

        with open(self.quality_log_path, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.log_fieldnames)
            if write_header:
                writer.writeheader()
            writer.writerow(entry)

        return entry

    def validate_schema(self, df: pd.DataFrame, expected_columns: List[str]) -> Dict[str, Any]:
        """Check presence of expected columns."""
        actual_cols = set(df.columns)
        expected_set = set(expected_columns)
        missing = list(expected_set - actual_cols)
        status = "FAIL" if missing else "PASS"

        finding = {
            "check_id": "schema_completeness",
            "rule_id": "DQ-SCH-001",
            "status": status,
            "severity": "critical" if missing else "info",
            "records_checked": len(df),
            "records_affected": len(missing),
            "message": f"Missing columns: {missing}" if missing else "All expected columns present."
        }
        self.log_decision(
            rule_id="DQ-SCH-001",
            action=ActionType.NO_ACTION if status == "PASS" else ActionType.FLAG,
            records_checked=len(df),
            records_affected=len(missing),
            severity=finding["severity"],
            rationale=finding["message"]
        )
        return finding

    def validate_missingness(self, df: pd.DataFrame, target_col: str = "pm25_target_24h") -> Dict[str, Any]:
        """Ensure no nulls exist in the ground forecasting target."""
        null_count = int(df[target_col].isna().sum())
        status = "FAIL" if null_count > 0 else "PASS"

        finding = {
            "check_id": f"missingness_{target_col}",
            "rule_id": "DQ-NULL-001",
            "status": status,
            "severity": "critical" if null_count > 0 else "info",
            "records_checked": len(df),
            "records_affected": null_count,
            "message": f"{null_count} null target values detected." if null_count > 0 else "Zero null target values."
        }
        self.log_decision(
            rule_id="DQ-NULL-001",
            action=ActionType.NO_ACTION if status == "PASS" else ActionType.FLAG,
            records_checked=len(df),
            records_affected=null_count,
            severity=finding["severity"],
            rationale=finding["message"]
        )
        return finding

    def validate_ranges(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Validate physical ranges for PM2.5 and meteorological covariates."""
        findings = []

        # PM2.5 target range: 0 to 1500 ug/m3
        if "pm25_target_24h" in df.columns:
            out_of_range = int(((df["pm25_target_24h"] < 0) | (df["pm25_target_24h"] > 1500)).sum())
            status = "WARN" if out_of_range > 0 else "PASS"
            finding = {
                "check_id": "range_pm25_target",
                "rule_id": "DQ-RNG-001",
                "status": status,
                "severity": "warning" if out_of_range > 0 else "info",
                "records_checked": len(df),
                "records_affected": out_of_range,
                "message": f"{out_of_range} PM2.5 readings outside [0, 1500] ug/m3."
            }
            findings.append(finding)
            self.log_decision(
                rule_id="DQ-RNG-001",
                action=ActionType.FLAG if out_of_range > 0 else ActionType.NO_ACTION,
                records_checked=len(df),
                records_affected=out_of_range,
                severity=finding["severity"],
                rationale=finding["message"]
            )

        # Temperature 2m: -10 to 60 °C
        if "T2M" in df.columns:
            t_out = int(((df["T2M"] < -10) | (df["T2M"] > 60)).sum())
            status = "FAIL" if t_out > 0 else "PASS"
            finding = {
                "check_id": "range_temperature",
                "rule_id": "DQ-RNG-002",
                "status": status,
                "severity": "critical" if t_out > 0 else "info",
                "records_checked": len(df),
                "records_affected": t_out,
                "message": f"{t_out} temperature values outside [-10, 60] °C."
            }
            findings.append(finding)
            self.log_decision(
                rule_id="DQ-RNG-002",
                action=ActionType.FLAG if t_out > 0 else ActionType.NO_ACTION,
                records_checked=len(df),
                records_affected=t_out,
                severity=finding["severity"],
                rationale=finding["message"]
            )

        # Relative humidity: 0 to 100%
        if "RH2M" in df.columns:
            rh_out = int(((df["RH2M"] < 0) | (df["RH2M"] > 100)).sum())
            status = "FAIL" if rh_out > 0 else "PASS"
            finding = {
                "check_id": "range_relative_humidity",
                "rule_id": "DQ-RNG-003",
                "status": status,
                "severity": "critical" if rh_out > 0 else "info",
                "records_checked": len(df),
                "records_affected": rh_out,
                "message": f"{rh_out} RH2M values outside [0, 100]%."
            }
            findings.append(finding)
            self.log_decision(
                rule_id="DQ-RNG-003",
                action=ActionType.FLAG if rh_out > 0 else ActionType.NO_ACTION,
                records_checked=len(df),
                records_affected=rh_out,
                severity=finding["severity"],
                rationale=finding["message"]
            )

        return findings

    def validate_duplicates(self, df: pd.DataFrame, key_col: str = "record_id") -> Dict[str, Any]:
        """Validate uniqueness of stable record identifiers."""
        dup_count = int(df.duplicated(subset=[key_col]).sum())
        status = "FAIL" if dup_count > 0 else "PASS"

        finding = {
            "check_id": f"uniqueness_{key_col}",
            "rule_id": "DQ-DUP-001",
            "status": status,
            "severity": "critical" if dup_count > 0 else "info",
            "records_checked": len(df),
            "records_affected": dup_count,
            "message": f"{dup_count} duplicate record IDs detected." if dup_count > 0 else "All record IDs are strictly unique."
        }
        self.log_decision(
            rule_id="DQ-DUP-001",
            action=ActionType.NO_ACTION if status == "PASS" else ActionType.FLAG,
            records_checked=len(df),
            records_affected=dup_count,
            severity=finding["severity"],
            rationale=finding["message"]
        )
        return finding

    def run_full_validation(
        self,
        df: pd.DataFrame,
        expected_columns: List[str],
        output_report_path: Path
    ) -> Dict[str, Any]:
        """
        Run all validation checks and write output report JSON.
        """
        checks = []
        checks.append(self.validate_schema(df, expected_columns))
        checks.append(self.validate_missingness(df))
        checks.extend(self.validate_ranges(df))
        checks.append(self.validate_duplicates(df))

        overall_status = "PASS"
        if any(c["status"] == "FAIL" for c in checks):
            overall_status = "FAIL"
        elif any(c["status"] == "WARN" for c in checks):
            overall_status = "WARN"

        report = {
            "schema_version": "1.0",
            "run_id": f"RUN-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "status": overall_status,
            "total_records_checked": len(df),
            "checks": checks
        }

        output_report_path = Path(output_report_path)
        output_report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        return report
