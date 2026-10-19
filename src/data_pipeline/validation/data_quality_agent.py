"""
Data Quality Agent & Policy Orchestrator.
HackInsight 2026 - Member 3: Agentic Data Quality & Decision Support.

Responsibilities:
1. Orchestrate deterministic validation tools (ValidationEngine, DataProfiler).
2. Execute an explicit, auditable action policy:
   - NO_ACTION: Observation passes validation check.
   - FLAG: Observation exhibits anomaly that cannot be safely/unambiguously repaired.
   - FILL: Defensible deterministic imputation for non-target covariates without lookahead.
   - FIX: Deterministic normalization of technical artifacts (e.g. whitespace, duplicates).
3. Enforce strict safety:
   - Never fabricate PM2.5 measurements.
   - Never fill targets or features using future values (leakage prevention).
   - Prefer FLAG over unsafe FIX or FILL.
4. Maintain auditable quality logs (CSV) and structured machine-readable assessments (JSON).
"""

from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import json
import argparse
import pandas as pd
import numpy as np

from src.data_pipeline.validation.quality_engine import ValidationEngine, ActionType
from src.data_pipeline.profiling.profiler import DataProfiler


@dataclass
class QualityDecision:
    """Structured record of an auditable data quality decision."""
    rule_id: str
    check_id: str
    action: str
    severity: str
    records_checked: int
    records_affected: int
    data_modified: bool
    rationale: str
    timestamp_utc: str


class DataQualityAgent:
    """
    Autonomous Data Quality Agent that inspects datasets via deterministic
    tools and applies an explicit policy governing NO_ACTION, FLAG, FILL, and FIX.
    """

    DEFAULT_EXPECTED_COLUMNS = [
        "record_id", "timestamp_utc", "city", "sensor_id",
        "latitude", "longitude", "pm25", "pm25_baseline_persistence", "pm25_target_24h",
        "T2M", "RH2M", "WS10M", "WD10M", "PS", "PRECTOTCORR", "T2MDEW"
    ]

    def __init__(
        self,
        quality_log_path: Optional[Path] = None,
        validation_report_path: Optional[Path] = None,
        profiler_dir: Optional[Path] = None
    ):
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        self.quality_log_path = Path(quality_log_path) if quality_log_path else base_dir / "reports" / "data_quality" / "quality_log.csv"
        self.validation_report_path = Path(validation_report_path) if validation_report_path else base_dir / "reports" / "data_quality" / "validation_report.json"
        self.assessment_report_path = self.validation_report_path.parent / "agent_quality_assessment.json"
        self.profiler_dir = Path(profiler_dir) if profiler_dir else self.validation_report_path.parent

        self.engine = ValidationEngine(self.quality_log_path)
        self.profiler = DataProfiler(output_dir=self.profiler_dir)

    def _record_decision(
        self,
        rule_id: str,
        check_id: str,
        action: ActionType,
        severity: str,
        records_checked: int,
        records_affected: int,
        data_modified: bool,
        rationale: str
    ) -> QualityDecision:
        """Log decision to persistent engine and return structured decision object."""
        # Log to engine's persistent CSV audit log
        self.engine.log_decision(
            rule_id=rule_id,
            action=action,
            records_checked=records_checked,
            records_affected=records_affected,
            severity=severity,
            rationale=f"[Modified={data_modified}] {rationale}" if data_modified else rationale
        )

        return QualityDecision(
            rule_id=rule_id,
            check_id=check_id,
            action=action.value,
            severity=severity,
            records_checked=records_checked,
            records_affected=records_affected,
            data_modified=data_modified,
            rationale=rationale,
            timestamp_utc=datetime.now(timezone.utc).isoformat()
        )

    def evaluate_schema(
        self,
        df: pd.DataFrame,
        expected_columns: List[str]
    ) -> QualityDecision:
        """
        Rule DQ-SCH-001: Validate presence of contract schema columns.
        Policy:
        - If missing columns exist: FLAG (severity=critical). Cannot invent schema columns.
        - If all present: NO_ACTION.
        """
        missing = [c for c in expected_columns if c not in df.columns]
        if missing:
            return self._record_decision(
                rule_id="DQ-SCH-001",
                check_id="schema_completeness",
                action=ActionType.FLAG,
                severity="critical",
                records_checked=len(df),
                records_affected=len(missing),
                data_modified=False,
                rationale=f"Dataset violates schema contract; missing columns: {missing}. Automated remediation rejected."
            )
        return self._record_decision(
            rule_id="DQ-SCH-001",
            check_id="schema_completeness",
            action=ActionType.NO_ACTION,
            severity="info",
            records_checked=len(df),
            records_affected=0,
            data_modified=False,
            rationale="All contract schema columns are present."
        )

    def evaluate_and_fix_formatting(
        self,
        df: pd.DataFrame,
        auto_remediate: bool = False
    ) -> Tuple[pd.DataFrame, QualityDecision]:
        """
        Rule DQ-FIX-001: Deterministic string whitespace normalization.
        Policy:
        - Safe to strip leading/trailing whitespace in string identifier columns.
        - If auto_remediate=True: FIX and set data_modified=True.
        - If auto_remediate=False: FLAG anomaly.
        """
        string_cols = [c for c in df.select_dtypes(include=["object", "string"]).columns]
        affected_count = 0
        df_out = df.copy()

        for col in string_cols:
            has_whitespace = df[col].astype(str).str.strip() != df[col].astype(str)
            whitespace_rows = int(has_whitespace.sum())
            if whitespace_rows > 0:
                affected_count += whitespace_rows
                if auto_remediate:
                    df_out[col] = df_out[col].astype(str).str.strip()

        if affected_count > 0:
            action = ActionType.FIX if auto_remediate else ActionType.FLAG
            return df_out, self._record_decision(
                rule_id="DQ-FIX-001",
                check_id="string_formatting_whitespace",
                action=action,
                severity="info" if auto_remediate else "warning",
                records_checked=len(df),
                records_affected=affected_count,
                data_modified=auto_remediate,
                rationale=(
                    f"Trimmed leading/trailing whitespace across {affected_count} field values."
                    if auto_remediate else
                    f"Detected {affected_count} un-trimmed string entries; requires whitespace FIX."
                )
            )

        return df_out, self._record_decision(
            rule_id="DQ-FIX-001",
            check_id="string_formatting_whitespace",
            action=ActionType.NO_ACTION,
            severity="info",
            records_checked=len(df),
            records_affected=0,
            data_modified=False,
            rationale="No untrimmed string whitespace detected."
        )

    def evaluate_and_fix_duplicates(
        self,
        df: pd.DataFrame,
        key_col: str = "record_id",
        auto_remediate: bool = False
    ) -> Tuple[pd.DataFrame, QualityDecision]:
        """
        Rule DQ-DUP-001: Primary identifier uniqueness and exact duplicate deduplication.
        Policy:
        - If duplicate keys exist with EXACTLY IDENTICAL values:
            - auto_remediate=True: FIX by deduplicating (keep first).
            - auto_remediate=False: FLAG.
        - If duplicate keys exist with CONFLICTING values:
            - Always FLAG (unsafe to guess ground truth).
        - If zero duplicates: NO_ACTION.
        """
        if key_col not in df.columns:
            return df, self._record_decision(
                rule_id="DQ-DUP-001",
                check_id=f"uniqueness_{key_col}",
                action=ActionType.FLAG,
                severity="critical",
                records_checked=len(df),
                records_affected=len(df),
                data_modified=False,
                rationale=f"Key column '{key_col}' missing; cannot evaluate uniqueness."
            )

        dup_mask = df.duplicated(subset=[key_col], keep=False)
        dup_count = int(df.duplicated(subset=[key_col], keep="first").sum())

        if dup_count == 0:
            return df, self._record_decision(
                rule_id="DQ-DUP-001",
                check_id=f"uniqueness_{key_col}",
                action=ActionType.NO_ACTION,
                severity="info",
                records_checked=len(df),
                records_affected=0,
                data_modified=False,
                rationale=f"All '{key_col}' identifiers are strictly unique."
            )

        # Check if duplicates are exact identical rows
        exact_dup_mask = df.duplicated(keep="first")
        exact_dup_count = int(exact_dup_mask.sum())

        if exact_dup_count == dup_count and auto_remediate:
            df_repaired = df.drop_duplicates(subset=[key_col], keep="first").reset_index(drop=True)
            return df_repaired, self._record_decision(
                rule_id="DQ-DUP-001",
                check_id=f"uniqueness_{key_col}",
                action=ActionType.FIX,
                severity="info",
                records_checked=len(df),
                records_affected=dup_count,
                data_modified=True,
                rationale=f"Deduplicated {dup_count} exact identical redundant records on '{key_col}', retaining first occurrence."
            )

        # Conflicting duplicates or auto_remediate=False
        return df, self._record_decision(
            rule_id="DQ-DUP-001",
            check_id=f"uniqueness_{key_col}",
            action=ActionType.FLAG,
            severity="critical",
            records_checked=len(df),
            records_affected=dup_count,
            data_modified=False,
            rationale=f"Detected {dup_count} duplicate '{key_col}' collisions. Automated overwrite unsafe; FLAGGED."
        )

    def evaluate_target_missingness(
        self,
        df: pd.DataFrame,
        target_cols: Optional[List[str]] = None
    ) -> List[QualityDecision]:
        """
        Rule DQ-NULL-001: Forecasting target missingness.
        Policy:
        - NEVER FILL forecasting targets (pm25, pm25_target_24h). Fabricating targets
          violates scientific validity and introduces lookahead/leakage risk.
        - Missing targets must always be FLAGGED.
        """
        targets = target_cols or ["pm25_target_24h", "pm25"]
        decisions = []

        for target in targets:
            if target not in df.columns:
                continue
            null_count = int(df[target].isna().sum())
            if null_count > 0:
                decisions.append(self._record_decision(
                    rule_id="DQ-NULL-001",
                    check_id=f"target_missingness_{target}",
                    action=ActionType.FLAG,
                    severity="critical",
                    records_checked=len(df),
                    records_affected=null_count,
                    data_modified=False,
                    rationale=(
                        f"Detected {null_count} null target values in '{target}'. "
                        "Target imputation is strictly prohibited to prevent data fabrication and leakage; FLAGGED."
                    )
                ))
            else:
                decisions.append(self._record_decision(
                    rule_id="DQ-NULL-001",
                    check_id=f"target_missingness_{target}",
                    action=ActionType.NO_ACTION,
                    severity="info",
                    records_checked=len(df),
                    records_affected=0,
                    data_modified=False,
                    rationale=f"Zero null values in target column '{target}'."
                ))

        return decisions

    def evaluate_and_fill_covariates(
        self,
        df: pd.DataFrame,
        covariate_cols: Optional[List[str]] = None,
        max_fill_gap: int = 2,
        auto_remediate: bool = False
    ) -> Tuple[pd.DataFrame, QualityDecision]:
        """
        Rule DQ-FILL-001: Defensible non-target covariate imputation.
        Policy:
        - Applied ONLY to continuous meteorological covariates (e.g. T2M, RH2M).
        - Maximum allowable gap is max_fill_gap hours (default: 2).
        - Uses strictly backward-looking forward fill (ffill) to prevent forward leakage.
        - If gap > max_fill_gap or auto_remediate=False: FLAG.
        - If clean: NO_ACTION.
        """
        covariates = covariate_cols or ["T2M", "RH2M", "WS10M", "WD10M", "PS", "PRECTOTCORR", "T2MDEW"]
        present_covs = [c for c in covariates if c in df.columns]
        
        total_nulls = sum(int(df[c].isna().sum()) for c in present_covs)
        if total_nulls == 0:
            return df, self._record_decision(
                rule_id="DQ-FILL-001",
                check_id="covariate_missingness",
                action=ActionType.NO_ACTION,
                severity="info",
                records_checked=len(df),
                records_affected=0,
                data_modified=False,
                rationale="Zero null values across all meteorological covariates."
            )

        df_out = df.copy()
        if auto_remediate:
            # Safe forward fill with strictly bounded limit within sensor/city grouping if available
            group_cols = [c for c in ["city", "sensor_id"] if c in df_out.columns]
            filled_count = 0
            
            for cov in present_covs:
                if df_out[cov].isna().any():
                    if group_cols:
                        orig_na = df_out[cov].isna()
                        df_out[cov] = df_out.groupby(group_cols)[cov].ffill(limit=max_fill_gap)
                        filled_count += int((orig_na & df_out[cov].notna()).sum())
                    else:
                        orig_na = df_out[cov].isna()
                        df_out[cov] = df_out[cov].ffill(limit=max_fill_gap)
                        filled_count += int((orig_na & df_out[cov].notna()).sum())

            remaining_nulls = sum(int(df_out[c].isna().sum()) for c in present_covs)
            
            if filled_count > 0 and remaining_nulls == 0:
                return df_out, self._record_decision(
                    rule_id="DQ-FILL-001",
                    check_id="covariate_missingness",
                    action=ActionType.FILL,
                    severity="info",
                    records_checked=len(df),
                    records_affected=filled_count,
                    data_modified=True,
                    rationale=(
                        f"Safely filled {filled_count} missing covariate values using "
                        f"backward-looking forward fill (max limit={max_fill_gap}h). Zero future leakage."
                    )
                )

        # Unsafe fill (remaining gaps > max_fill_gap) or auto_remediate=False
        return df_out, self._record_decision(
            rule_id="DQ-FILL-001",
            check_id="covariate_missingness",
            action=ActionType.FLAG,
            severity="warning",
            records_checked=len(df),
            records_affected=total_nulls,
            data_modified=False,
            rationale=(
                f"Detected {total_nulls} missing covariate values. "
                "Gaps exceed safe fill threshold (2h) or remediation disabled; FLAGGED."
            )
        )

    def evaluate_ranges(self, df: pd.DataFrame) -> List[QualityDecision]:
        """
        Rules DQ-RNG-001, DQ-RNG-002, DQ-RNG-003: Physical boundary validation.
        Policy:
        - Scientific sensor data must NEVER be arbitrarily clipped or fabricated.
        - Any out-of-physical-range measurement is FLAGGED.
        """
        decisions = []

        # DQ-RNG-001: PM2.5 in [0, 1500] ug/m3
        pm25_col = "pm25_target_24h" if "pm25_target_24h" in df.columns else ("pm25" if "pm25" in df.columns else None)
        if pm25_col:
            pm25_series = df[pm25_col].dropna()
            out_of_range = int(((pm25_series < 0) | (pm25_series > 1500)).sum())
            if out_of_range > 0:
                decisions.append(self._record_decision(
                    rule_id="DQ-RNG-001",
                    check_id="range_pm25",
                    action=ActionType.FLAG,
                    severity="critical" if (pm25_series < 0).any() else "warning",
                    records_checked=len(df),
                    records_affected=out_of_range,
                    data_modified=False,
                    rationale=f"{out_of_range} PM2.5 observations outside physical bounds [0, 1500] ug/m3; FLAGGED."
                ))
            else:
                decisions.append(self._record_decision(
                    rule_id="DQ-RNG-001",
                    check_id="range_pm25",
                    action=ActionType.NO_ACTION,
                    severity="info",
                    records_checked=len(df),
                    records_affected=0,
                    data_modified=False,
                    rationale="All PM2.5 observations conform to physical bounds [0, 1500] ug/m3."
                ))

        # DQ-RNG-002: Temperature in [-10, 60] °C
        if "T2M" in df.columns:
            t_series = df["T2M"].dropna()
            t_out = int(((t_series < -10) | (t_series > 60)).sum())
            if t_out > 0:
                decisions.append(self._record_decision(
                    rule_id="DQ-RNG-002",
                    check_id="range_temperature",
                    action=ActionType.FLAG,
                    severity="critical",
                    records_checked=len(df),
                    records_affected=t_out,
                    data_modified=False,
                    rationale=f"{t_out} temperature readings outside realistic range [-10, 60] °C; FLAGGED."
                ))
            else:
                decisions.append(self._record_decision(
                    rule_id="DQ-RNG-002",
                    check_id="range_temperature",
                    action=ActionType.NO_ACTION,
                    severity="info",
                    records_checked=len(df),
                    records_affected=0,
                    data_modified=False,
                    rationale="All temperature values conform to realistic range [-10, 60] °C."
                ))

        # DQ-RNG-003: Relative Humidity in [0, 100]%
        if "RH2M" in df.columns:
            rh_series = df["RH2M"].dropna()
            rh_out = int(((rh_series < 0) | (rh_series > 100)).sum())
            if rh_out > 0:
                decisions.append(self._record_decision(
                    rule_id="DQ-RNG-003",
                    check_id="range_relative_humidity",
                    action=ActionType.FLAG,
                    severity="critical",
                    records_checked=len(df),
                    records_affected=rh_out,
                    data_modified=False,
                    rationale=f"{rh_out} RH2M readings outside physical percentage bounds [0, 100]%; FLAGGED."
                ))
            else:
                decisions.append(self._record_decision(
                    rule_id="DQ-RNG-003",
                    check_id="range_relative_humidity",
                    action=ActionType.NO_ACTION,
                    severity="info",
                    records_checked=len(df),
                    records_affected=0,
                    data_modified=False,
                    rationale="All relative humidity readings conform to [0, 100]%."
                ))

        return decisions

    def evaluate_temporal_continuity(
        self,
        df: pd.DataFrame,
        expected_step_hours: int = 1
    ) -> QualityDecision:
        """
        Rule DQ-TMP-001: Time-series continuity and outage gap detection.
        Policy:
        - Observational gaps indicate network outage or power failure.
        - Gaps cannot be safely synthesized; they are FLAGGED for model awareness.
        """
        ts_col = "timestamp_utc" if "timestamp_utc" in df.columns else ("datetime" if "datetime" in df.columns else None)
        if not ts_col:
            return self._record_decision(
                rule_id="DQ-TMP-001",
                check_id="temporal_continuity",
                action=ActionType.FLAG,
                severity="warning",
                records_checked=len(df),
                records_affected=len(df),
                data_modified=False,
                rationale="Timestamp column not available for temporal continuity assessment."
            )

        series_col = "sensor_id" if "sensor_id" in df.columns else None
        res = self.profiler.profile_temporal_continuity(
            df=df,
            timestamp_col=ts_col,
            expected_step_hours=expected_step_hours,
            series_id_col=series_col
        )

        gaps_count = res.get("total_gaps_detected", 0)
        max_gap = res.get("max_gap_hours", 0.0)

        if gaps_count > 0:
            return self._record_decision(
                rule_id="DQ-TMP-001",
                check_id="temporal_continuity",
                action=ActionType.FLAG,
                severity="warning",
                records_checked=len(df),
                records_affected=gaps_count,
                data_modified=False,
                rationale=(
                    f"Detected {gaps_count} temporal gaps exceeding {expected_step_hours}h "
                    f"(maximum gap: {max_gap}h). Time series discontinuity preserved; FLAGGED."
                )
            )

        return self._record_decision(
            rule_id="DQ-TMP-001",
            check_id="temporal_continuity",
            action=ActionType.NO_ACTION,
            severity="info",
            records_checked=len(df),
            records_affected=0,
            data_modified=False,
            rationale=f"Time series exhibits continuous hourly progression with zero unexpected gaps."
        )

    def evaluate_sensor_flatlines(
        self,
        df: pd.DataFrame,
        window_size: int = 6
    ) -> QualityDecision:
        """
        Rule DQ-FLT-001: Sensor flatline detection (frozen transducer / ADC lock).
        Policy:
        - When a low-cost optical sensor reports identical PM2.5 for >= 6 consecutive hours,
          it strongly indicates hardware stall or stuck ADC.
        - Cannot safely unfreeze without raw telemetry; FLAGGED.
        """
        target_col = "pm25" if "pm25" in df.columns else ("pm25_target_24h" if "pm25_target_24h" in df.columns else None)
        if not target_col:
            return self._record_decision(
                rule_id="DQ-FLT-001",
                check_id="sensor_flatlining",
                action=ActionType.NO_ACTION,
                severity="info",
                records_checked=len(df),
                records_affected=0,
                data_modified=False,
                rationale="No PM2.5 column present for flatline inspection."
            )

        series_col = "sensor_id" if "sensor_id" in df.columns else None
        res = self.profiler.detect_flatlines(
            df=df,
            value_cols=[target_col],
            window_size=window_size,
            series_id_col=series_col
        )

        flatline_events = res.get("flatline_events_count", 0)
        records_affected = res.get("flatline_records_affected", 0)

        if flatline_events > 0:
            return self._record_decision(
                rule_id="DQ-FLT-001",
                check_id="sensor_flatlining",
                action=ActionType.FLAG,
                severity="warning",
                records_checked=len(df),
                records_affected=records_affected,
                data_modified=False,
                rationale=(
                    f"Detected {flatline_events} sensor flatline episodes (>={window_size}h constant {target_col}) "
                    f"affecting {records_affected} records. Indicates potential frozen sensor; FLAGGED."
                )
            )

        return self._record_decision(
            rule_id="DQ-FLT-001",
            check_id="sensor_flatlining",
            action=ActionType.NO_ACTION,
            severity="info",
            records_checked=len(df),
            records_affected=0,
            data_modified=False,
            rationale=f"Zero flatline sequences (>={window_size} consecutive hours) detected."
        )

    def evaluate_timeliness(self, df: pd.DataFrame) -> QualityDecision:
        """
        Rule DQ-TIM-001: Data freshness and timestamp validity.
        Policy:
        - Validates that timestamps parse cleanly and exist within reasonable historical bounds.
        """
        ts_col = "timestamp_utc" if "timestamp_utc" in df.columns else ("datetime" if "datetime" in df.columns else None)
        if not ts_col:
            return self._record_decision(
                rule_id="DQ-TIM-001",
                check_id="data_timeliness",
                action=ActionType.FLAG,
                severity="warning",
                records_checked=len(df),
                records_affected=len(df),
                data_modified=False,
                rationale="Timestamp column absent; timeliness cannot be verified."
            )

        ts = pd.to_datetime(df[ts_col], utc=True, errors="coerce")
        invalid_ts = int(ts.isna().sum())
        if invalid_ts > 0:
            return self._record_decision(
                rule_id="DQ-TIM-001",
                check_id="data_timeliness",
                action=ActionType.FLAG,
                severity="critical",
                records_checked=len(df),
                records_affected=invalid_ts,
                data_modified=False,
                rationale=f"Detected {invalid_ts} unparseable timestamps; FLAGGED."
            )

        return self._record_decision(
            rule_id="DQ-TIM-001",
            check_id="data_timeliness",
            action=ActionType.NO_ACTION,
            severity="info",
            records_checked=len(df),
            records_affected=0,
            data_modified=False,
            rationale=f"All timestamps parse validly in UTC. Range: {ts.min()} to {ts.max()}."
        )

    def evaluate_distribution_spikes(
        self,
        df: pd.DataFrame,
        spike_threshold: float = 800.0
    ) -> QualityDecision:
        """
        Rule DQ-DST-001: Extreme distribution anomaly and spike detection.
        Policy:
        - Detects extreme localized pollution spikes exceeding 800 ug/m3.
        - Preserved for episodic air-quality evaluation; FLAGGED as warning.
        """
        pm25_col = "pm25" if "pm25" in df.columns else ("pm25_target_24h" if "pm25_target_24h" in df.columns else None)
        if not pm25_col:
            return self._record_decision(
                rule_id="DQ-DST-001",
                check_id="distribution_spikes",
                action=ActionType.NO_ACTION,
                severity="info",
                records_checked=len(df),
                records_affected=0,
                data_modified=False,
                rationale="No PM2.5 column present for distribution spike inspection."
            )

        spikes = int((df[pm25_col] > spike_threshold).sum())
        if spikes > 0:
            return self._record_decision(
                rule_id="DQ-DST-001",
                check_id="distribution_spikes",
                action=ActionType.FLAG,
                severity="warning",
                records_checked=len(df),
                records_affected=spikes,
                data_modified=False,
                rationale=(
                    f"Detected {spikes} extreme PM2.5 readings exceeding {spike_threshold} ug/m3. "
                    "Preserved as severe episodic pollution events; FLAGGED for expert review."
                )
            )

        return self._record_decision(
            rule_id="DQ-DST-001",
            check_id="distribution_spikes",
            action=ActionType.NO_ACTION,
            severity="info",
            records_checked=len(df),
            records_affected=0,
            data_modified=False,
            rationale=f"Zero readings exceeding extreme spike threshold ({spike_threshold} ug/m3)."
        )

    def run_assessment(
        self,
        df: pd.DataFrame,
        expected_columns: Optional[List[str]] = None,
        auto_remediate: bool = False
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Run end-to-end Data Quality Agent assessment and auditable policy dispatch.

        Args:
            df: Input dataset (remains unmodified unless auto_remediate=True produces repaired copy).
            expected_columns: Schema columns to verify (defaults to canonical gold schema).
            auto_remediate: When True, applies safe deterministic FIX and bounded FILL actions.

        Returns:
            Tuple of (remediated_or_original_dataframe, assessment_dictionary).
        """
        expected_cols = expected_columns or self.DEFAULT_EXPECTED_COLUMNS
        current_df = df.copy()
        decisions: List[QualityDecision] = []

        # 1. Schema check
        decisions.append(self.evaluate_schema(current_df, expected_cols))

        # 2. Deterministic String Formatting (FIX/FLAG/NO_ACTION)
        current_df, dec = self.evaluate_and_fix_formatting(current_df, auto_remediate=auto_remediate)
        decisions.append(dec)

        # 3. Duplicate Identifier check (FIX/FLAG/NO_ACTION)
        current_df, dec = self.evaluate_and_fix_duplicates(current_df, key_col="record_id", auto_remediate=auto_remediate)
        decisions.append(dec)

        # 4. Target Missingness check (FLAG/NO_ACTION - never fill targets)
        decisions.extend(self.evaluate_target_missingness(current_df))

        # 5. Covariate Missingness check (FILL/FLAG/NO_ACTION)
        current_df, dec = self.evaluate_and_fill_covariates(current_df, auto_remediate=auto_remediate)
        decisions.append(dec)

        # 6. Physical Ranges (FLAG/NO_ACTION)
        decisions.extend(self.evaluate_ranges(current_df))

        # 7. Temporal Continuity (FLAG/NO_ACTION)
        decisions.append(self.evaluate_temporal_continuity(current_df))

        # 8. Sensor Flatlines (FLAG/NO_ACTION)
        decisions.append(self.evaluate_sensor_flatlines(current_df))

        # 9. Timeliness / Freshness (FLAG/NO_ACTION)
        decisions.append(self.evaluate_timeliness(current_df))

        # 10. Extreme Distribution Spikes (FLAG/NO_ACTION)
        decisions.append(self.evaluate_distribution_spikes(current_df))

        # Synthesize assessment summary
        actions_summary = {
            ActionType.NO_ACTION.value: 0,
            ActionType.FLAG.value: 0,
            ActionType.FILL.value: 0,
            ActionType.FIX.value: 0
        }
        for d in decisions:
            actions_summary[d.action] = actions_summary.get(d.action, 0) + 1

        total_affected = sum(d.records_affected for d in decisions if d.action != ActionType.NO_ACTION.value)
        data_was_modified = any(d.data_modified for d in decisions)

        overall_status = "PASS"
        if any(d.severity == "critical" and d.action != ActionType.FIX.value for d in decisions):
            overall_status = "FAIL"
        elif any(d.severity == "warning" for d in decisions):
            overall_status = "WARN"

        findings = [
            {
                "rule_id": d.rule_id,
                "check_id": d.check_id,
                "action": d.action,
                "severity": d.severity,
                "records_affected": d.records_affected,
                "rationale": d.rationale
            }
            for d in decisions if d.action != ActionType.NO_ACTION.value
        ]

        recommendations = []
        if overall_status == "FAIL":
            recommendations.append("Critical data quality anomalies detected. Resolve schema/missingness before downstream modeling.")
        elif overall_status == "WARN":
            recommendations.append("Sensors exhibit temporal gaps, episodic spikes, or flatlines. Maintain anomaly flags in training features.")
        else:
            recommendations.append("All deterministic checks passed. Dataset is certified clean for ML modeling.")

        report = {
            "schema_version": "2.0",
            "run_id": f"RUN-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "overall_status": overall_status,
            "total_records_checked": len(df),
            "records_affected_total": total_affected,
            "checks_run": len(decisions),
            "actions_summary": actions_summary,
            "data_modified": data_was_modified,
            "decisions": [asdict(d) for d in decisions],
            "findings": findings,
            "recommendations": recommendations
        }

        # Export structured reports
        self.validation_report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.validation_report_path, "w", encoding="utf-8") as f:
            # Maintain backward-compatible JSON schema fields for validation_report.json
            legacy_compatible_report = {
                "schema_version": "2.0",
                "run_id": report["run_id"],
                "generated_at_utc": report["generated_at_utc"],
                "status": overall_status,
                "total_records_checked": len(df),
                "checks": [
                    {
                        "check_id": d.check_id,
                        "rule_id": d.rule_id,
                        "status": "PASS" if d.action == ActionType.NO_ACTION.value else ("WARN" if d.severity == "warning" else "FAIL"),
                        "severity": d.severity,
                        "records_checked": d.records_checked,
                        "records_affected": d.records_affected,
                        "action_taken": d.action,
                        "message": d.rationale
                    }
                    for d in decisions
                ],
                "actions_summary": actions_summary,
                "data_modified": data_was_modified,
                "recommendations": recommendations
            }
            json.dump(legacy_compatible_report, f, indent=2)

        with open(self.assessment_report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        return current_df, report


def main():
    parser = argparse.ArgumentParser(description="HackInsight 2026 Data Quality Agent CLI")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("data/processed/gold_pm25_forecasting.parquet"),
        help="Path to input parquet or csv dataset."
    )
    parser.add_argument(
        "--auto-remediate",
        action="store_true",
        help="Apply safe deterministic FIX and bounded FILL actions (off by default)."
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=None,
        help="Custom destination for validation_report.json."
    )
    parser.add_argument(
        "--log",
        type=Path,
        default=None,
        help="Custom destination for quality_log.csv."
    )

    args = parser.parse_args()
    input_path = args.input

    if not input_path.exists():
        print(f"Error: Target dataset not found at {input_path}")
        return 1

    print("=" * 80)
    print("HACKINSIGHT 2026: DATA QUALITY AGENT AUDIT & EVALUATION")
    print("=" * 80)
    print(f"Input Dataset:  {input_path}")
    print(f"Auto-Remediate: {args.auto_remediate}")

    if str(input_path).endswith(".parquet"):
        df = pd.read_parquet(input_path)
    else:
        df = pd.read_csv(input_path)

    agent = DataQualityAgent(
        quality_log_path=args.log,
        validation_report_path=args.report
    )

    _, report = agent.run_assessment(df, auto_remediate=args.auto_remediate)

    print("\n--- Assessment Summary ---")
    print(f"Overall Status:        {report['overall_status']}")
    print(f"Total Records Checked: {report['total_records_checked']:,}")
    print(f"Checks Run:            {report['checks_run']}")
    print(f"Actions Summary:       {report['actions_summary']}")
    print(f"Data Modified:         {report['data_modified']}")
    print(f"Findings Count:        {len(report['findings'])}")
    print(f"Report JSON:           {agent.validation_report_path}")
    print(f"Assessment JSON:       {agent.assessment_report_path}")
    print(f"Quality Log CSV:       {agent.quality_log_path}")

    if report["findings"]:
        print("\nTop Findings:")
        for f in report["findings"][:5]:
            print(f"  [{f['severity'].upper()}] {f['rule_id']} ({f['action']}): {f['rationale']}")

    print("\nRecommendations:")
    for r in report["recommendations"]:
        print(f"  - {r}")
    print("=" * 80)
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())
