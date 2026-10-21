"""
Unit tests for 18/24 Statistical Validity Rule for Daily Aggregations.
"""

import numpy as np
import pandas as pd
import pytest

from src.data_pipeline.processing import compute_daily_validity


def test_18_of_24_rule_boundary_conditions():
    """Verify that exactly 17 hours yields invalid, and 18 hours yields valid within a PKT calendar day."""
    # 19:00 UTC = 00:00 PKT (start of PKT calendar date 2024-01-01)
    # Test case 1: 17 valid hours
    ts_17 = pd.date_range("2023-12-31 19:00:00", periods=17, freq="h", tz="UTC")
    df_17 = pd.DataFrame({
        "timestamp_utc": ts_17,
        "sensor_id": "sensor_test_17",
        "city": "Lahore",
        "pm25": [100.0] * 17
    })

    res_17 = compute_daily_validity(df_17, min_hours=18)
    assert len(res_17) == 1
    row_17 = res_17.iloc[0]
    assert row_17["pkt_date"] == "2024-01-01"
    assert row_17["n_valid_hours"] == 17
    assert row_17["is_valid_day"] is False or row_17["is_valid_day"] == 0
    assert row_17["validity_flag"] == "insufficient_hours"
    assert np.isnan(row_17["pm25_mean"])

    # Test case 2: 18 valid hours
    ts_18 = pd.date_range("2023-12-31 19:00:00", periods=18, freq="h", tz="UTC")
    df_18 = pd.DataFrame({
        "timestamp_utc": ts_18,
        "sensor_id": "sensor_test_18",
        "city": "Lahore",
        "pm25": [100.0] * 18
    })

    res_18 = compute_daily_validity(df_18, min_hours=18)
    assert len(res_18) == 1
    row_18 = res_18.iloc[0]
    assert row_18["pkt_date"] == "2024-01-01"
    assert row_18["n_valid_hours"] == 18
    assert row_18["is_valid_day"] is True or row_18["is_valid_day"] == 1
    assert row_18["validity_flag"] == "valid"
    assert row_18["pm25_mean"] == 100.0
    assert row_18["pm25_min"] == 100.0
    assert row_18["pm25_max"] == 100.0


def test_daily_validity_with_nulls_and_flags():
    """Verify that nulls and flagged readings do not count towards the 18-hour threshold."""
    # 24 hours of 2024-01-01 PKT (19:00 UTC on 2023-12-31 to 18:00 UTC on 2024-01-01)
    ts_24 = pd.date_range("2023-12-31 19:00:00", periods=24, freq="h", tz="UTC")
    # 24 hours total, but 7 hours are null -> 17 valid hours -> invalid
    pm25_vals = [50.0] * 17 + [np.nan] * 7
    df_nulls = pd.DataFrame({
        "timestamp_utc": ts_24,
        "sensor_id": "sensor_flag_test",
        "city": "Karachi",
        "pm25": pm25_vals,
    })

    res = compute_daily_validity(df_nulls, min_hours=18)
    assert len(res) == 1
    assert res.iloc[0]["pkt_date"] == "2024-01-01"
    assert res.iloc[0]["n_valid_hours"] == 17
    assert res.iloc[0]["validity_flag"] == "insufficient_hours"
    assert np.isnan(res.iloc[0]["pm25_mean"])
