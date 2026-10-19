"""
Command-Line Interface (CLI) for Data Pipeline.
HackInsight 2026 - Member 1: Reproducibility & Automation Interface.

Usage:
    python -m src.data_pipeline.cli ingest
    python -m src.data_pipeline.cli profile
    python -m src.data_pipeline.cli clean
    python -m src.data_pipeline.cli validate
    python -m src.data_pipeline.cli build-gold
    python -m src.data_pipeline.cli make-data
"""

import sys
import argparse
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(
        description="HackInsight 2026 PM2.5 Data Pipeline CLI"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available pipeline stages")

    subparsers.add_parser("ingest", help="Acquire raw files and update manifest")
    subparsers.add_parser("profile", help="Run structural and temporal profiling")
    subparsers.add_parser("clean", help="Reshape matrix and normalize to UTC")
    subparsers.add_parser("validate", help="Run deterministic validation engine")
    subparsers.add_parser("build-gold", help="Construct Gold feature and target dataset")
    subparsers.add_parser("make-data", help="Rebuild all layers (raw -> cleaned -> gold) end-to-end")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    print(f"Executing pipeline stage: {args.command}")
    # TODO: Connect CLI commands to respective pipeline managers
    sys.exit(0)


if __name__ == "__main__":
    main()
