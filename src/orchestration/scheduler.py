"""
Scheduler & Execution Infrastructure for PM2.5 Forecasting Pipeline.
HackInsight 2026 - Member 4: Orchestration, Integration, Dashboard & Deployment.

Provides execution CLI to:
1. Trigger a manual run: python -m src.orchestration.scheduler run-once
2. Deploy to Prefect: python -m src.orchestration.scheduler deploy
3. Start local daemon worker: python -m src.orchestration.scheduler start-worker
4. Check pipeline health & freshness: python -m src.orchestration.scheduler status
"""

import sys
import time
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from src.orchestration.flows import (
    pm25_hourly_pipeline,
    deploy_hourly_flow,
    OUTPUTS_DIR,
    FORECASTS_DIR,
    QUALITY_DIR,
    RUN_HISTORY_DIR
)


def get_pipeline_status() -> Dict[str, Any]:
    """Inspect output directories and return system health, data freshness, and run history."""
    history_file = RUN_HISTORY_DIR / "run_history.json"
    latest_forecast_file = FORECASTS_DIR / "latest_forecast.json"
    latest_quality_file = QUALITY_DIR / "latest_quality.json"

    history = []
    if history_file.is_file():
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            pass

    last_run = history[0] if history else None
    forecast_available = latest_forecast_file.is_file()
    quality_available = latest_quality_file.is_file()

    # Calculate data freshness
    data_age_hours = None
    if last_run and last_run.get("timestamp_utc"):
        try:
            last_dt = datetime.fromisoformat(last_run["timestamp_utc"])
            now_dt = datetime.now(timezone.utc)
            data_age_hours = round((now_dt - last_dt).total_seconds() / 3600.0, 2)
        except Exception:
            pass

    return {
        "status": "HEALTHY" if (last_run and last_run.get("status") == "SUCCESS") else ("DEGRADED" if last_run else "UNINITIALIZED"),
        "total_recorded_runs": len(history),
        "last_run": last_run,
        "data_age_hours": data_age_hours,
        "forecast_published": forecast_available,
        "quality_published": quality_available,
        "schedule": "0 * * * * (Hourly)",
        "timezone": "Asia/Karachi"
    }


def run_local_worker(interval_seconds: int = 3600):
    """
    Local runner that executes the pipeline on an hourly schedule
    for local deployment and demonstration purposes.
    """
    print("=" * 80)
    print("STARTING LOCAL HOURLY PREFECT WORKER")
    print(f"Schedule:  Every {interval_seconds}s (Cron: 0 * * * *)")
    print("Timezone:  Asia/Karachi (Pakistan Standard Time)")
    print("Press Ctrl+C to terminate worker.")
    print("=" * 80)

    try:
        while True:
            print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting scheduled pipeline execution...")
            result = pm25_hourly_pipeline()
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Execution finished with status: {result.get('status')}")
            time.sleep(interval_seconds)
    except KeyboardInterrupt:
        print("\nWorker gracefully stopped by user.")


def main():
    parser = argparse.ArgumentParser(description="HackInsight 2026 PM2.5 Orchestration & Scheduler CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available scheduler commands")

    subparsers.add_parser("run-once", help="Trigger a single complete flow execution immediately")
    subparsers.add_parser("deploy", help="Deploy the flow to Prefect with hourly cron schedule in Asia/Karachi")
    subparsers.add_parser("status", help="Inspect pipeline execution history, health, and data freshness")

    worker_parser = subparsers.add_parser("start-worker", help="Start continuous hourly runner daemon")
    worker_parser.add_argument("--interval", type=int, default=3600, help="Interval in seconds between runs (default: 3600)")

    args = parser.parse_args()

    if args.command == "run-once":
        res = pm25_hourly_pipeline()
        print(f"\nRun Result:\nStatus: {res.get('status')}\nRun ID: {res.get('run_id')}\nDuration: {res.get('duration_seconds')}s")
    elif args.command == "deploy":
        deploy_hourly_flow()
    elif args.command == "status":
        status = get_pipeline_status()
        print("\n" + "=" * 60)
        print("PIPELINE ORCHESTRATION & SYSTEM STATUS")
        print("=" * 60)
        print(f"Overall Status:      {status['status']}")
        print(f"Total Recorded Runs: {status['total_recorded_runs']}")
        print(f"Schedule:            {status['schedule']}")
        print(f"Timezone:            {status['timezone']}")
        print(f"Data Freshness (Age):{status['data_age_hours']} hours ago")
        if status['last_run']:
            print(f"Last Run ID:         {status['last_run'].get('run_id')}")
            print(f"Last Run Status:     {status['last_run'].get('status')}")
            print(f"Last Run Duration:   {status['last_run'].get('duration_seconds')}s")
        print("=" * 60)
    elif args.command == "start-worker":
        run_local_worker(args.interval)
    else:
        # Default: show status
        status = get_pipeline_status()
        print(f"Pipeline status: {status['status']} (Last run: {status['last_run'].get('timestamp_utc') if status['last_run'] else 'Never'})")


if __name__ == "__main__":
    main()
