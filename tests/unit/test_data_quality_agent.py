"""
Unit Tests for Data Quality Agent and Policy Enforcement.
HackInsight 2026 - Member 3: Data Quality Agent.

Test Coverage:
A. Clean dataset produces NO_ACTION across checks.
B. Schema violation produces FLAG (severity=critical).
C. Missing-value cases: safe bounded FILL for covariates, unsafe missing target produces FLAG.
D. Deterministic fix: FIX occurs for unambiguous normalization (whitespace, identical duplicates).
E. Impossible PM2.5: FLAGGED without silent fabrication or arbitrary clipping.
F. Duplicate records: FIX for identical duplicates, FLAG for conflicting key collisions.
G. Temporal gap: detected and FLAGGED.
H. Flatline: detected and FLAGGED.
I. Audit logging: every decision contains rule_id, action, rationale, records_affected.
J. No leakage: agent strictly uses backward-looking fill (never future target values).
"""

import unittest
import tempfile
import shutil
from pathlib import Path
import pandas as pd
import numpy as np

from src.data_pipeline.validation.data_quality_agent import DataQualityAgent, ActionType
from src.data_pipeline.profiling.profiler import DataProfiler


class TestDataQualityAgent(unittest.TestCase):
    """Verifies all policy requirements of the Data Quality Agent."""

    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp())
        self.quality_log = self.test_dir / "quality_log.csv"
        self.validation_report = self.test_dir / "validation_report.json"
        self.agent = DataQualityAgent(
            quality_log_path=self.quality_log,
            validation_report_path=self.validation_report,
            profiler_dir=self.test_dir
        )

        # Baseline clean dataset fixture
        self.clean_df = pd.DataFrame({
            "record_id": [f"rec_{i}" for i in range(10)],
            "timestamp_utc": pd.date_range("2024-01-01 00:00:00", periods=10, freq="1h", tz="UTC"),
            "city": ["Lahore"] * 10,
            "sensor_id": ["sensor_lahore_01"] * 10,
            "latitude": [31.52] * 10,
            "longitude": [74.35] * 10,
            "pm25": [50.0 + i for i in range(10)],
            "pm25_baseline_persistence": [48.0 + i for i in range(10)],
            "pm25_target_24h": [55.0 + i for i in range(10)],
            "T2M": [15.0 + (i * 0.1) for i in range(10)],
            "RH2M": [60.0] * 10,
            "WS10M": [2.5] * 10,
            "WD10M": [180.0] * 10,
            "PS": [101.3] * 10,
            "PRECTOTCORR": [0.0] * 10,
            "T2MDEW": [8.0] * 10
        })

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_a_clean_dataset_produces_no_action(self):
        """Test A: Clean valid dataset produces NO_ACTION and overall status PASS."""
        _, report = self.agent.run_assessment(self.clean_df, auto_remediate=False)
        self.assertEqual(report["overall_status"], "PASS")
        self.assertEqual(report["actions_summary"][ActionType.FLAG.value], 0)
        self.assertEqual(report["actions_summary"][ActionType.FILL.value], 0)
        self.assertEqual(report["actions_summary"][ActionType.FIX.value], 0)
        self.assertGreater(report["actions_summary"][ActionType.NO_ACTION.value], 0)
        self.assertFalse(report["data_modified"])

    def test_b_schema_violation_produces_flag(self):
        """Test B: Missing required schema columns produces FLAG with critical severity."""
        df_invalid = self.clean_df.drop(columns=["pm25_target_24h", "T2M"])
        decision = self.agent.evaluate_schema(df_invalid, expected_columns=self.agent.DEFAULT_EXPECTED_COLUMNS)
        self.assertEqual(decision.action, ActionType.FLAG.value)
        self.assertEqual(decision.severity, "critical")
        self.assertEqual(decision.records_affected, 2)
        self.assertFalse(decision.data_modified)
        self.assertIn("pm25_target_24h", decision.rationale)

    def test_c_missing_value_policy_fill_vs_flag(self):
        """
        Test C:
        1. Non-target covariate with isolated gap (<= 2h) safely FILLs without lookahead.
        2. Target missingness is NEVER filled and always produces FLAG.
        3. Covariate gap exceeding threshold (> 2h) produces FLAG.
        """
        # Case 1: Safe covariate fill (1 null in T2M)
        df_cov_missing = self.clean_df.copy()
        df_cov_missing.loc[2, "T2M"] = np.nan
        df_filled, dec_fill = self.agent.evaluate_and_fill_covariates(
            df_cov_missing, max_fill_gap=2, auto_remediate=True
        )
        self.assertEqual(dec_fill.action, ActionType.FILL.value)
        self.assertTrue(dec_fill.data_modified)
        self.assertEqual(df_filled.loc[2, "T2M"], df_cov_missing.loc[1, "T2M"])  # Backward ffill
        self.assertFalse(df_filled["T2M"].isna().any())

        # Case 2: Target missingness must FLAG, never FILL
        df_target_missing = self.clean_df.copy()
        df_target_missing.loc[3, "pm25_target_24h"] = np.nan
        dec_target = self.agent.evaluate_target_missingness(df_target_missing)
        flagged_dec = [d for d in dec_target if d.check_id == "target_missingness_pm25_target_24h"][0]
        self.assertEqual(flagged_dec.action, ActionType.FLAG.value)
        self.assertEqual(flagged_dec.severity, "critical")
        self.assertFalse(flagged_dec.data_modified)
        self.assertIn("strictly prohibited", flagged_dec.rationale)

        # Case 3: Covariate gap > 2h must FLAG even if auto_remediate=True
        df_large_gap = self.clean_df.copy()
        df_large_gap.loc[2:5, "T2M"] = np.nan  # 4 consecutive hours null
        _, dec_large = self.agent.evaluate_and_fill_covariates(
            df_large_gap, max_fill_gap=2, auto_remediate=True
        )
        self.assertEqual(dec_large.action, ActionType.FLAG.value)
        self.assertFalse(dec_large.data_modified)

    def test_d_deterministic_fix_whitespace_formatting(self):
        """Test D: String whitespace formatting is safely and deterministically FIXed."""
        df_whitespace = self.clean_df.copy()
        df_whitespace.loc[0, "city"] = " Lahore  "
        df_whitespace.loc[1, "sensor_id"] = " sensor_lahore_01 "

        df_fixed, dec = self.agent.evaluate_and_fix_formatting(df_whitespace, auto_remediate=True)
        self.assertEqual(dec.action, ActionType.FIX.value)
        self.assertTrue(dec.data_modified)
        self.assertEqual(df_fixed.loc[0, "city"], "Lahore")
        self.assertEqual(df_fixed.loc[1, "sensor_id"], "sensor_lahore_01")

    def test_e_impossible_pm25_produces_flag_no_fabrication(self):
        """Test E: Physically impossible PM2.5 values are FLAGGED, never silently clipped."""
        df_extreme = self.clean_df.copy()
        df_extreme.loc[2, "pm25_target_24h"] = -15.0
        df_extreme.loc[5, "pm25_target_24h"] = 2500.0

        decisions = self.agent.evaluate_ranges(df_extreme)
        pm25_dec = [d for d in decisions if d.check_id == "range_pm25"][0]
        self.assertEqual(pm25_dec.action, ActionType.FLAG.value)
        self.assertEqual(pm25_dec.records_affected, 2)
        self.assertFalse(pm25_dec.data_modified)
        # Value in DataFrame must remain unchanged (no fabrication)
        self.assertEqual(df_extreme.loc[2, "pm25_target_24h"], -15.0)

    def test_f_duplicate_records_policy(self):
        """Test F: Identical duplicates produce FIX; conflicting key collisions produce FLAG."""
        # Exact identical duplicate
        df_exact_dup = pd.concat([self.clean_df, self.clean_df.iloc[[0]]], ignore_index=True)
        df_repaired, dec_fix = self.agent.evaluate_and_fix_duplicates(
            df_exact_dup, key_col="record_id", auto_remediate=True
        )
        self.assertEqual(dec_fix.action, ActionType.FIX.value)
        self.assertTrue(dec_fix.data_modified)
        self.assertEqual(len(df_repaired), len(self.clean_df))

        # Conflicting duplicates (same key, different measurement)
        df_conflict = self.clean_df.copy()
        conflict_row = self.clean_df.iloc[0].copy()
        conflict_row["pm25"] = 999.0
        df_conflict = pd.concat([df_conflict, pd.DataFrame([conflict_row])], ignore_index=True)
        _, dec_flag = self.agent.evaluate_and_fix_duplicates(
            df_conflict, key_col="record_id", auto_remediate=True
        )
        self.assertEqual(dec_flag.action, ActionType.FLAG.value)
        self.assertEqual(dec_flag.severity, "critical")
        self.assertFalse(dec_flag.data_modified)

    def test_g_temporal_continuity_gap_detection(self):
        """Test G: Gaps in hourly continuity are detected and FLAGGED."""
        df_gap = self.clean_df.copy()
        # Drop rows 4, 5, 6 creating a 4-hour temporal gap
        df_gap = df_gap.drop(index=[4, 5, 6]).reset_index(drop=True)

        dec = self.agent.evaluate_temporal_continuity(df_gap, expected_step_hours=1)
        self.assertEqual(dec.action, ActionType.FLAG.value)
        self.assertEqual(dec.severity, "warning")
        self.assertGreater(dec.records_affected, 0)
        self.assertFalse(dec.data_modified)
        self.assertIn("temporal gaps", dec.rationale)

    def test_h_sensor_flatline_detection(self):
        """Test H: Constant readings for >= 6 consecutive hours trigger flatline FLAG."""
        df_flat = self.clean_df.copy()
        # Set pm25 to constant 42.0 for 7 consecutive rows
        df_flat.loc[1:7, "pm25"] = 42.0

        dec = self.agent.evaluate_sensor_flatlines(df_flat, window_size=6)
        self.assertEqual(dec.action, ActionType.FLAG.value)
        self.assertEqual(dec.severity, "warning")
        self.assertGreater(dec.records_affected, 0)
        self.assertFalse(dec.data_modified)
        self.assertIn("flatline episodes", dec.rationale)

    def test_i_audit_logging_and_report_generation(self):
        """Test I: Every decision produces structured entries in CSV and JSON report."""
        _, report = self.agent.run_assessment(self.clean_df, auto_remediate=False)

        # JSON report assertions
        self.assertTrue(self.validation_report.exists())
        self.assertIn("schema_version", report)
        self.assertIn("run_id", report)
        self.assertIn("overall_status", report)
        self.assertIn("checks_run", report)
        self.assertIn("actions_summary", report)
        self.assertIn("findings", report)
        self.assertIn("recommendations", report)

        # CSV log assertions
        self.assertTrue(self.quality_log.exists())
        log_df = pd.read_csv(self.quality_log)
        self.assertGreater(len(log_df), 0)
        for expected_col in ["timestamp_utc", "rule_id", "action", "records_checked", "records_affected", "severity", "rationale"]:
            self.assertIn(expected_col, log_df.columns)

    def test_j_no_leakage_in_remediation(self):
        """
        Test J: Confirm that covariate remediation uses strictly past information
        (forward fill with max limit) and NEVER uses future target values.
        """
        df_leak_test = self.clean_df.copy()
        # Null at row 2, known past at row 1, future shift at row 3
        df_leak_test.loc[1, "T2M"] = 20.0
        df_leak_test.loc[2, "T2M"] = np.nan
        df_leak_test.loc[3, "T2M"] = 35.0

        repaired_df, dec = self.agent.evaluate_and_fill_covariates(
            df_leak_test, max_fill_gap=2, auto_remediate=True
        )
        self.assertEqual(dec.action, ActionType.FILL.value)
        # Value must equal row 1 (past), NEVER row 3 (future)
        self.assertEqual(repaired_df.loc[2, "T2M"], 20.0)
        self.assertNotEqual(repaired_df.loc[2, "T2M"], 35.0)


if __name__ == "__main__":
    unittest.main()
