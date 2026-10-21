"""
Telemetry Data Provider for HackInsight Pipeline Monitoring.
Resilient layered provider supporting:
1. Remote Backend API (via BACKEND_API_URL).
2. Direct Workspace Artifacts (local/mounted outputs & reports).
3. Bundled Operational Snapshot (assets/status_snapshot.json).
4. Graceful degradation when services are unreachable.
"""

from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from datetime import datetime, timezone
import os
import json
import logging
import re
import pandas as pd
import requests

logger = logging.getLogger("hackinsight_telemetry")

# Configurable settings via Environment / Space Secrets
DEFAULT_FRESHNESS_THRESHOLD_HOURS = float(os.getenv("FRESHNESS_THRESHOLD_HOURS", "24.0"))
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "").strip()
VERCEL_APP_URL = os.getenv("VERCEL_APP_URL", "https://web-livid-eight-rcllafnbqq.vercel.app").strip()
GITHUB_REPO_URL = os.getenv("GITHUB_REPO_URL", "https://github.com/Ali-HF/HackInsight").strip()

# Secret pattern scrubber to ensure zero credential leakage
SECRET_PATTERNS = [
    re.compile(r"AIza[0-9A-Za-z-_]{35}"),               # Google API Key
    re.compile(r"sk-[a-zA-Z0-9]{32,}"),                 # OpenAI / generic secret
    re.compile(r"pnu_[a-zA-Z0-9_-]{20,}"),              # Prefect Cloud API Key
    re.compile(r"ghp_[a-zA-Z0-9]{36}"),                 # GitHub Token
    re.compile(r"Bearer\s+[a-zA-Z0-9_\-\.]{20,}", re.I) # Authorization Bearer
]


def scrub_secrets(text: Optional[str]) -> str:
    """Mask any accidentally included credentials or tokens."""
    if not text:
        return ""
    scrubbed = str(text)
    for pat in SECRET_PATTERNS:
        scrubbed = pat.sub("[REDACTED_CREDENTIAL]", scrubbed)
    return scrubbed


class TelemetryDataProvider:
    """Manages loading, parsing, and health calculation for pipeline telemetry."""

    def __init__(self, workspace_root: Any = "AUTO", snapshot_path: Optional[Path] = None):
        if workspace_root == "AUTO":
            self.workspace_root = self._detect_workspace_root()
        else:
            self.workspace_root = workspace_root
        self.snapshot_path = snapshot_path or (Path(__file__).resolve().parent / "assets" / "status_snapshot.json")
        self.freshness_threshold_hours = float(os.getenv("FRESHNESS_THRESHOLD_HOURS", str(DEFAULT_FRESHNESS_THRESHOLD_HOURS)))

    @staticmethod
    def _detect_workspace_root() -> Optional[Path]:
        """Detect project root if running inside or adjacent to the c:/HIS repository."""
        env_root = os.getenv("WORKSPACE_ROOT")
        if env_root and Path(env_root).is_dir():
            return Path(env_root)

        current = Path(__file__).resolve().parent
        # Candidate 1: Parent directory of huggingface-space
        if (current.parent / "outputs").is_dir() and (current.parent / "artifacts").is_dir():
            return current.parent
        # Candidate 2: Current directory
        if (current / "outputs").is_dir():
            return current
        return None

    def fetch_remote_telemetry(self, api_url: str, timeout: float = 5.0) -> Optional[Dict[str, Any]]:
        """Fetch telemetry from remote backend status endpoint if configured."""
        if not api_url:
            return None
        target_endpoint = f"{api_url.rstrip('/')}/api/status" if not api_url.endswith("/status") else api_url
        try:
            resp = requests.get(target_endpoint, timeout=timeout)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, dict):
                    data["_data_source_mode"] = "Remote Backend API"
                    return data
            logger.warning(f"Remote backend returned status {resp.status_code}")
        except Exception as e:
            logger.warning(f"Remote backend unreachable at {target_endpoint}: {e}")
        return None

    def fetch_workspace_telemetry(self) -> Optional[Dict[str, Any]]:
        """Extract live telemetry directly from local project artifacts."""
        if not self.workspace_root or not self.workspace_root.is_dir():
            return None

        outputs_dir = self.workspace_root / "outputs"
        reports_dir = self.workspace_root / "reports"
        artifacts_dir = self.workspace_root / "artifacts"

        history_file = outputs_dir / "run_history" / "run_history.json"
        forecast_file = outputs_dir / "forecasts" / "latest_forecast.json"
        quality_file = outputs_dir / "quality" / "latest_quality.json"
        metrics_file = artifacts_dir / "reports" / "metrics_summary.json"

        # Check that essential outputs exist
        if not history_file.is_file() and not forecast_file.is_file():
            return None

        telemetry: Dict[str, Any] = {
            "_data_source_mode": "Direct Workspace Artifacts",
            "project_name": "HackInsight",
            "data_source_name": "Pakistan Air Quality Initiative (PAQI) / NASA ASDC DAAC",
            "freshness_threshold_hours": self.freshness_threshold_hours
        }

        # 1. Run History
        if history_file.is_file():
            try:
                with open(history_file, "r", encoding="utf-8") as f:
                    history_data = json.load(f)
                telemetry["run_history"] = history_data
                last_run = history_data[0] if history_data else None
                telemetry["pipeline_status"] = {
                    "status": "HEALTHY" if (last_run and last_run.get("status") == "SUCCESS") else ("DEGRADED" if last_run else "UNINITIALIZED"),
                    "total_recorded_runs": len(history_data),
                    "schedule": "0 * * * * (Hourly)",
                    "timezone": "Asia/Karachi",
                    "last_run": last_run
                }
            except Exception as e:
                logger.error(f"Error reading run history: {e}")

        # 2. Latest Forecast
        if forecast_file.is_file():
            try:
                with open(forecast_file, "r", encoding="utf-8") as f:
                    telemetry["latest_forecast"] = json.load(f)
            except Exception as e:
                logger.error(f"Error reading latest forecast: {e}")

        # 3. Latest Quality
        if quality_file.is_file():
            try:
                with open(quality_file, "r", encoding="utf-8") as f:
                    telemetry["latest_quality"] = json.load(f)
            except Exception as e:
                logger.error(f"Error reading latest quality: {e}")

        # 4. Model Metrics
        if metrics_file.is_file():
            try:
                with open(metrics_file, "r", encoding="utf-8") as f:
                    telemetry["model_metrics"] = json.load(f)
            except Exception as e:
                logger.error(f"Error reading model metrics: {e}")

        return telemetry

    def fetch_snapshot_telemetry(self) -> Optional[Dict[str, Any]]:
        """Load bundled operational snapshot."""
        if self.snapshot_path and self.snapshot_path.is_file():
            try:
                with open(self.snapshot_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                data["_data_source_mode"] = "Bundled Operational Snapshot"
                data["freshness_threshold_hours"] = self.freshness_threshold_hours
                return data
            except Exception as e:
                logger.error(f"Error reading snapshot: {e}")
        return None

    def get_telemetry(self) -> Dict[str, Any]:
        """
        Retrieve telemetry following strict priority order:
        1. Remote API (if BACKEND_API_URL configured)
        2. Workspace artifacts (if local project available)
        3. Bundled operational snapshot
        4. Gracefully degraded empty state
        """
        # 1. Remote API
        if BACKEND_API_URL:
            remote = self.fetch_remote_telemetry(BACKEND_API_URL)
            if remote:
                return remote

        # 2. Workspace
        workspace = self.fetch_workspace_telemetry()
        if workspace:
            return workspace

        # 3. Snapshot
        snapshot = self.fetch_snapshot_telemetry()
        if snapshot:
            return snapshot

        # 4. Graceful Fallback
        return {
            "_data_source_mode": "Unavailable",
            "error": "Unable to verify the latest system status.",
            "project_name": "HackInsight",
            "freshness_threshold_hours": self.freshness_threshold_hours,
            "pipeline_status": {"status": "UNKNOWN", "total_recorded_runs": 0, "last_run": None},
            "latest_forecast": None,
            "latest_quality": None,
            "model_metrics": None,
            "run_history": []
        }

    # -------------------------------------------------------------------------
    # Health Assessment Engines
    # -------------------------------------------------------------------------

    def evaluate_system_cards(self, telemetry: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Calculate evidence-grounded health status cards for the 5 core components:
        1. Data Pipeline
        2. Data Quality Agent
        3. PM2.5 Forecasting Model
        4. Insight/RAG Agent
        5. Automated Orchestration
        """
        cards = []

        # Card 1: Data Pipeline
        freshness = self.evaluate_data_freshness(telemetry)
        if freshness["status"] == "UNAVAILABLE":
            pipe_status = "UNKNOWN"
            pipe_desc = "No verified data ingestion records available."
        elif freshness["is_fresh"]:
            pipe_status = "HEALTHY"
            pipe_desc = f"Latest observation verified from {freshness['source']} ({freshness['age_display']})."
        else:
            pipe_status = "STALE"
            pipe_desc = f"Data age ({freshness['age_display']}) exceeds threshold ({self.freshness_threshold_hours}h)."

        cards.append({
            "name": "Data Pipeline & Ingestion",
            "status": pipe_status,
            "last_verified": freshness["latest_observation"] or "Not available",
            "explanation": pipe_desc,
            "ref_link": "docs/data_source_register.md"
        })

        # Card 2: Data Quality Agent
        quality = telemetry.get("latest_quality") or {}
        qa_data = quality.get("quality_assessment", {})
        overall_dq = qa_data.get("overall_status")
        dq_records = qa_data.get("total_records_checked")
        dq_time = qa_data.get("generated_at_utc") or quality.get("timestamp_utc")

        if not overall_dq:
            dq_status = "UNKNOWN"
            dq_desc = "Quality audit report not located."
        elif overall_dq == "PASS":
            dq_status = "HEALTHY"
            dq_desc = f"All {dq_records:,} records passed deterministic verification checks with 0 flags."
        elif overall_dq == "WARN":
            dq_status = "WARNING"
            actions = qa_data.get("actions_summary", {})
            flags_count = actions.get("FLAG", 0)
            dq_desc = f"Quality audit completed with {flags_count} non-breaking sensor flags. Target integrity preserved."
        else:
            dq_status = "FAILED"
            dq_desc = "Critical schema or value violation detected by validation rules."

        cards.append({
            "name": "Data Quality Agent",
            "status": dq_status,
            "last_verified": dq_time or "Not available",
            "explanation": dq_desc,
            "ref_link": "reports/data_quality/validation_report.json"
        })

        # Card 3: PM2.5 Forecasting Model
        forecast = telemetry.get("latest_forecast") or {}
        fc_data = forecast.get("forecast_data", {})
        cities = fc_data.get("cities", {})
        has_verified_predictions = bool(cities and all(c.get("predicted_pm25_24h") is not None for c in cities.values()))
        fc_time = forecast.get("timestamp_utc") or fc_data.get("issue_timestamp")

        if has_verified_predictions:
            model_status = "HEALTHY"
            lahore_val = cities.get("Lahore", {}).get("predicted_pm25_24h", "N/A")
            karachi_val = cities.get("Karachi", {}).get("predicted_pm25_24h", "N/A")
            model_desc = f"Verified 24h predictions published for Lahore ({lahore_val} µg/m³) & Karachi ({karachi_val} µg/m³)."
        elif forecast:
            model_status = "WARNING"
            model_desc = "Forecast structure exists but some city predictions are incomplete."
        else:
            model_status = "UNKNOWN"
            model_desc = "No published forecast artifact located."

        cards.append({
            "name": "PM2.5 Forecasting Model (t+24h)",
            "status": model_status,
            "last_verified": fc_time or "Not available",
            "explanation": model_desc,
            "ref_link": "artifacts/models/pm25_forecaster.joblib"
        })

        # Card 4: Insight / RAG Agent
        last_run = (telemetry.get("pipeline_status") or {}).get("last_run") or {}
        grounding_ok = last_run.get("agent_grounding_passed")
        run_time = last_run.get("timestamp_utc")

        if grounding_ok is True:
            agent_status = "HEALTHY"
            agent_desc = "Deterministic grounding verification active. Strict zero-hallucination policy enforced."
        elif grounding_ok is False:
            agent_status = "WARNING"
            agent_desc = "Last agent execution flagged an unverified numerical assertion."
        else:
            agent_status = "UNKNOWN"
            agent_desc = "No recent agent interaction audit log located."

        cards.append({
            "name": "Decision-Support Insight Agent",
            "status": agent_status,
            "last_verified": run_time or "Not available",
            "explanation": agent_desc,
            "ref_link": "src/insight_agent/interface.py"
        })

        # Card 5: Automated Orchestration
        pipe = telemetry.get("pipeline_status") or {}
        orch_state = pipe.get("status")
        total_runs = pipe.get("total_recorded_runs", 0)

        if orch_state == "HEALTHY":
            orch_status = "HEALTHY"
            orch_desc = f"Prefect hourly flow operational ({pipe.get('schedule', '0 * * * *')}). Total runs recorded: {total_runs}."
        elif orch_state == "DEGRADED":
            orch_status = "WARNING"
            err = scrub_secrets(last_run.get("error") or "Non-fatal retry occurred")
            orch_desc = f"Last execution failed or retried: {err[:80]}..."
        elif orch_state == "FAILED":
            orch_status = "FAILED"
            orch_desc = f"Pipeline execution failed: {scrub_secrets(last_run.get('error'))[:80]}"
        else:
            orch_status = "UNKNOWN"
            orch_desc = "Prefect scheduler uninitialized or no runs recorded."

        cards.append({
            "name": "Prefect Automated Orchestration",
            "status": orch_status,
            "last_verified": run_time or "Not available",
            "explanation": orch_desc,
            "ref_link": "src/orchestration/flows.py"
        })

        return cards

    def evaluate_data_freshness(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """Compute verified data freshness and threshold compliance."""
        forecast = telemetry.get("latest_forecast") or {}
        validation = forecast.get("validation", {})
        last_obs = validation.get("latest_timestamp")
        pipe_run = (telemetry.get("pipeline_status") or {}).get("last_run", {})
        last_pipeline = pipe_run.get("timestamp_utc") if pipe_run else None

        source_name = telemetry.get("data_source_name", "PAQI Ground Sensor Network")

        if not last_obs:
            return {
                "status": "UNAVAILABLE",
                "source": source_name,
                "latest_observation": None,
                "latest_pipeline_run": last_pipeline,
                "age_hours": None,
                "age_display": "Not available",
                "is_fresh": False,
                "threshold_hours": self.freshness_threshold_hours
            }

        try:
            obs_dt = datetime.fromisoformat(last_obs.replace("Z", "+00:00"))
            now_dt = datetime.now(timezone.utc)
            age_hours = round(max(0.0, (now_dt - obs_dt).total_seconds() / 3600.0), 2)
            is_fresh = age_hours <= self.freshness_threshold_hours
            age_display = f"{age_hours:.1f} hours" if age_hours < 72 else f"{age_hours / 24:.1f} days"
        except Exception:
            age_hours = None
            age_display = "Not available"
            is_fresh = False

        return {
            "status": "AVAILABLE",
            "source": source_name,
            "latest_observation": last_obs,
            "latest_pipeline_run": last_pipeline,
            "age_hours": age_hours,
            "age_display": age_display,
            "is_fresh": is_fresh,
            "threshold_hours": self.freshness_threshold_hours
        }

    def evaluate_quality_metrics(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """Extract verified metrics calculated by Data Quality Agent."""
        quality = telemetry.get("latest_quality") or {}
        qa = quality.get("quality_assessment") or {}
        decisions = qa.get("decisions", [])

        # Missing values findings
        target_nulls = "Not available"
        duplicate_records = "Not available"
        schema_status = "Not available"

        for d in decisions:
            check = d.get("check_id", "")
            if check == "target_missingness_pm25_target_24h" or check == "target_missingness_pm25":
                target_nulls = d.get("records_affected", 0)
            elif "uniqueness" in check:
                duplicate_records = d.get("records_affected", 0)
            elif "schema" in check:
                schema_status = d.get("action", "PASS")

        actions = qa.get("actions_summary", {})
        return {
            "overall_status": qa.get("overall_status", "Not available"),
            "execution_timestamp": qa.get("generated_at_utc", quality.get("timestamp_utc", "Not available")),
            "records_checked": qa.get("total_records_checked", "Not available"),
            "checks_run": qa.get("checks_run", "Not available"),
            "target_nulls": target_nulls,
            "duplicate_records": duplicate_records,
            "schema_validation": schema_status if schema_status != "NO_ACTION" else "PASS (All columns valid)",
            "no_action_count": actions.get("NO_ACTION", "Not available"),
            "flag_count": actions.get("FLAG", "Not available"),
            "fill_count": actions.get("FILL", "Not available"),
            "fix_count": actions.get("FIX", "Not available")
        }

    def evaluate_model_details(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """Extract model metadata, evaluation metrics, and verified predictions."""
        metrics_meta = telemetry.get("model_metrics") or {}
        test_m = metrics_meta.get("test_metrics") or {}
        unc_m = metrics_meta.get("test_uncertainty_80pct") or {}

        forecast = telemetry.get("latest_forecast") or {}
        fc_data = forecast.get("forecast_data") or {}
        cities = fc_data.get("cities") or {}

        return {
            "model_name": metrics_meta.get("model_name", "HistGradientBoostingRegressor"),
            "model_version": metrics_meta.get("model_version", "1.0.0"),
            "horizon_hours": fc_data.get("horizon_hours", 24),
            "feature_count": metrics_meta.get("feature_count", 40),
            "issue_time": fc_data.get("issue_timestamp", forecast.get("timestamp_utc", "Not available")),
            "test_mae": test_m.get("model_mae", "Not available"),
            "base_mae": test_m.get("base_mae", "Not available"),
            "mae_improvement_pct": test_m.get("mae_pct_improvement", "Not available"),
            "coverage_80": unc_m.get("empirical_coverage_pct", "Not available"),
            "lahore_pm25": cities.get("Lahore", {}).get("predicted_pm25_24h", "Not available"),
            "lahore_ci": f"[{cities.get('Lahore', {}).get('lower_80', 'N/A')}, {cities.get('Lahore', {}).get('upper_80', 'N/A')}]" if "Lahore" in cities else "Not available",
            "karachi_pm25": cities.get("Karachi", {}).get("predicted_pm25_24h", "Not available"),
            "karachi_ci": f"[{cities.get('Karachi', {}).get('lower_80', 'N/A')}, {cities.get('Karachi', {}).get('upper_80', 'N/A')}]" if "Karachi" in cities else "Not available"
        }

    def get_execution_history_df(self, telemetry: Dict[str, Any]) -> pd.DataFrame:
        """Format run history into a pandas DataFrame."""
        runs = telemetry.get("run_history") or []
        if not runs:
            return pd.DataFrame(columns=["Run ID", "Timestamp (UTC)", "Status", "Duration (s)", "Records Checked", "Error Summary"])

        records = []
        for r in runs[:30]:
            err_scrubbed = scrub_secrets(r.get("error"))
            dur = r.get("duration_seconds")
            dur_str = f"{dur:.2f}s" if dur is not None else "N/A"
            records.append({
                "Run ID": r.get("run_id", "UNKNOWN"),
                "Timestamp (UTC)": r.get("timestamp_utc", "N/A"),
                "Status": r.get("status", "UNKNOWN"),
                "Duration (s)": dur_str,
                "Records Checked": f"{r.get('records_checked', 0):,}" if r.get("records_checked") is not None else "N/A",
                "Error Summary": err_scrubbed if err_scrubbed else "None (Clean)"
            })
        return pd.DataFrame(records)
