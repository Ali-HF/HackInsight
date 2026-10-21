"""
Data Profiling Module.
HackInsight 2026 - Member 1: Data Engineering & Quality.

Responsibilities:
1. Inspect dataset dimensions, types, null rates, and duplicate keys.
2. Profile time-series continuity, step frequencies, and outages.
3. Detect sensor flatlines and suspicious sentinel values.
4. Output structured machine-readable profiles (JSON) and summaries.
"""

from typing import Dict, Any, List, Optional
from pathlib import Path
import pandas as pd


class DataProfiler:
    """Produces reproducible profiling reports across raw and interim data."""

    def __init__(self, output_dir: Optional[Path] = None):
        """
        Initialize the DataProfiler.

        Args:
            output_dir: Optional destination path for profile reports (e.g. reports/data_quality/).
        """
        self.output_dir = Path(output_dir) if output_dir else None
        if self.output_dir:
            self.output_dir.mkdir(parents=True, exist_ok=True)

    def profile_structure(self, df: pd.DataFrame, dataset_id: str = "dataset") -> Dict[str, Any]:
        """
        Compute basic dimensions, column types, and missingness metrics.

        Logic:
        1. Calculate row count and column count.
        2. Compute null count and null percentage for every column.
        3. Identify duplicate rows across all columns.
        4. Return dictionary with structural summary.
        """
        row_count = len(df)
        col_count = len(df.columns)
        null_counts = {col: int(df[col].isna().sum()) for col in df.columns}
        null_pcts = {col: round(float(null_counts[col] / row_count * 100), 2) if row_count > 0 else 0.0 for col in df.columns}
        duplicate_rows = int(df.duplicated().sum())

        return {
            "dataset_id": dataset_id,
            "row_count": row_count,
            "column_count": col_count,
            "columns": list(df.columns),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "null_counts": null_counts,
            "null_percentages": null_pcts,
            "duplicate_rows": duplicate_rows
        }

    def profile_temporal_continuity(
        self,
        df: pd.DataFrame,
        timestamp_col: str = "datetime",
        expected_step_hours: int = 1,
        series_id_col: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Profile time-series timestamps for frequency, sorting, duplicates, and gaps.

        Logic:
        1. Assert timestamp column can be parsed as UTC datetime.
        2. Check for monotonic increasing order and duplicate timestamps within each series.
        3. Calculate differences between consecutive timestamps (diff).
        4. Detect minimum, maximum, median, and mode time delta.
        5. Identify gaps exceeding expected_step_hours.
        6. Return continuity summary with count and list of largest gaps.
        """
        if timestamp_col not in df.columns:
            if "timestamp_utc" in df.columns:
                timestamp_col = "timestamp_utc"
            elif "datetime" in df.columns:
                timestamp_col = "datetime"
            else:
                raise KeyError(f"Timestamp column '{timestamp_col}' not found in DataFrame.")

        df_work = df.copy()
        if not pd.api.types.is_datetime64_any_dtype(df_work[timestamp_col]):
            df_work[timestamp_col] = pd.to_datetime(df_work[timestamp_col], utc=True, errors="coerce")

        series_col = series_id_col if (series_id_col and series_id_col in df_work.columns) else None
        
        total_records = len(df_work)
        total_gaps = 0
        max_gap_hours = 0.0
        gap_samples = []
        is_monotonic_all = True
        total_dup_timestamps = 0

        groups = df_work.groupby(series_col) if series_col else [(None, df_work)]

        for group_key, grp in groups:
            grp_sorted = grp.sort_values(timestamp_col)
            ts = grp_sorted[timestamp_col].dropna()
            
            # Monotonicity check
            if not ts.is_monotonic_increasing:
                is_monotonic_all = False
            
            # Duplicate timestamps
            dups = int(ts.duplicated().sum())
            total_dup_timestamps += dups

            if len(ts) < 2:
                continue

            diffs = ts.diff().dropna()
            expected_delta = pd.Timedelta(expected_step_hours, unit="h")
            gap_mask = diffs > expected_delta
            gap_diffs = diffs[gap_mask]

            if len(gap_diffs) > 0:
                total_gaps += len(gap_diffs)
                group_max_gap = gap_diffs.max().total_seconds() / 3600.0
                if group_max_gap > max_gap_hours:
                    max_gap_hours = group_max_gap

                for idx in gap_diffs.index[:5]:
                    gap_start = grp_sorted.loc[idx - 1 if idx - 1 in grp_sorted.index else idx, timestamp_col]
                    gap_end = grp_sorted.loc[idx, timestamp_col]
                    gap_hours = (gap_end - gap_start).total_seconds() / 3600.0 if pd.notna(gap_start) and pd.notna(gap_end) else 0.0
                    gap_samples.append({
                        "series_id": str(group_key) if group_key is not None else "all",
                        "gap_hours": round(gap_hours, 2),
                        "start_timestamp": str(gap_start),
                        "end_timestamp": str(gap_end)
                    })

        return {
            "total_records_checked": total_records,
            "timestamp_col": timestamp_col,
            "series_col": series_col,
            "is_monotonic_increasing": is_monotonic_all,
            "duplicate_timestamps_within_series": total_dup_timestamps,
            "expected_step_hours": expected_step_hours,
            "total_gaps_detected": total_gaps,
            "max_gap_hours": round(max_gap_hours, 2),
            "sample_gaps": gap_samples[:10]
        }

    def detect_flatlines(
        self,
        df: pd.DataFrame,
        value_cols: List[str],
        window_size: int = 6,
        series_id_col: Optional[str] = None,
        timestamp_col: str = "timestamp_utc"
    ) -> Dict[str, Any]:
        """
        Detect sensor flatlining (consecutive identical values indicating frozen sensor).

        Logic:
        1. For each sensor/value column, compute differences between consecutive values.
        2. Identify sequences where values are constant for >= window_size consecutive readings.
        3. Record column name, series_id, start timestamp, and length of flatline sequence.
        4. Return flatline anomaly report.
        """
        valid_cols = [c for c in value_cols if c in df.columns]
        if not valid_cols:
            return {
                "total_records_checked": len(df),
                "columns_checked": [],
                "flatline_events_count": 0,
                "flatline_records_affected": 0,
                "events": []
            }

        df_work = df.copy()
        ts_col = timestamp_col if timestamp_col in df_work.columns else ("datetime" if "datetime" in df_work.columns else None)
        series_col = series_id_col if (series_id_col and series_id_col in df_work.columns) else None

        events = []
        total_affected_records = 0

        groups = df_work.groupby(series_col) if series_col else [(None, df_work)]

        for group_key, grp in groups:
            if ts_col:
                grp = grp.sort_values(ts_col)

            for col in valid_cols:
                series = grp[col].dropna()
                if len(series) < window_size:
                    continue

                # Run-length encoding via cumulative sum of changes
                blocks = (series != series.shift()).cumsum()
                block_sizes = series.groupby(blocks).transform("size")
                
                # Identify blocks with consecutive identical values >= window_size
                flatline_mask = block_sizes >= window_size
                if flatline_mask.any():
                    affected_in_group = int(flatline_mask.sum())
                    total_affected_records += affected_in_group

                    # Collect event summaries per block
                    for block_id, block_series in series[flatline_mask].groupby(blocks[flatline_mask]):
                        start_idx = block_series.index[0]
                        end_idx = block_series.index[-1]
                        start_time = str(grp.loc[start_idx, ts_col]) if ts_col and start_idx in grp.index else str(start_idx)
                        end_time = str(grp.loc[end_idx, ts_col]) if ts_col and end_idx in grp.index else str(end_idx)
                        
                        events.append({
                            "series_id": str(group_key) if group_key is not None else "all",
                            "column": col,
                            "constant_value": float(block_series.iloc[0]),
                            "consecutive_steps": len(block_series),
                            "start_time": start_time,
                            "end_time": end_time
                        })

        return {
            "total_records_checked": len(df),
            "columns_checked": valid_cols,
            "window_size": window_size,
            "flatline_events_count": len(events),
            "flatline_records_affected": total_affected_records,
            "events": events[:20]
        }
