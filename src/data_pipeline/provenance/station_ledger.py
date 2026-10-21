"""
Station Licensing & Provenance Ledger Module.
HackInsight 2026 - Member 1: Provenance, Legal Compliance & Data Governance.

Features:
1. Loads station-level licensing ledger from data/manifests/station_license_ledger.json.
2. Identifies provider attribution and open license type (CC-BY 4.0, PAQI Community Open, NASA ASDC).
3. Provides deterministic filter_verified_stations to exclude unverified sensors from regulated ML training data.
"""

from typing import Dict, Any, List, Set, Optional
from pathlib import Path
import json
import logging
import pandas as pd

logger = logging.getLogger(__name__)

LEDGER_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "manifests" / "station_license_ledger.json"


def load_station_license_ledger(ledger_path: Optional[Path] = None) -> Dict[str, Any]:
    """
    Load the immutable station provenance and licensing registry.

    Args:
        ledger_path: Optional custom path to station_license_ledger.json.

    Returns:
        Parsed JSON dictionary containing all station entries and audit metadata.
    """
    path = Path(ledger_path) if ledger_path else LEDGER_PATH
    if not path.is_file():
        raise FileNotFoundError(f"Station licensing ledger not found at {path}")

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_verified_station_ids(ledger_path: Optional[Path] = None) -> Set[str]:
    """
    Extract set of verified station IDs permitted in regulated ML model training.

    Returns:
        Set of station IDs where verification_status == 'VERIFIED' and exclusion_flag == False.
    """
    data = load_station_license_ledger(ledger_path)
    verified = set()
    for s in data.get("stations", []):
        if s.get("verification_status") == "VERIFIED" and not s.get("exclusion_flag", False):
            verified.add(s["station_id"])
    return verified


def filter_verified_stations(
    df: pd.DataFrame,
    station_col: str = "sensor_id",
    ledger_path: Optional[Path] = None
) -> pd.DataFrame:
    """
    Deterministic governance filter: excludes any sensor that cannot be legally verified.

    Args:
        df: Input DataFrame containing air quality sensor observations.
        station_col: Name of sensor/station column (default 'sensor_id').
        ledger_path: Optional path to station license ledger.

    Returns:
        Filtered DataFrame containing only legally verified stations.
    """
    if station_col not in df.columns:
        return df

    verified_ids = get_verified_station_ids(ledger_path)
    unverified_in_data = set(df[station_col].dropna().unique()) - verified_ids

    if unverified_in_data:
        logger.warning(
            f"Excluding {len(unverified_in_data)} unverified sensors from regulated dataset: {unverified_in_data}"
        )
        return df[df[station_col].isin(verified_ids)].copy()

    return df
