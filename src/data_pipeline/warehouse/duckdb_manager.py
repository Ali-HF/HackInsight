"""
Embedded DuckDB Analytical Warehouse Layer (HackInsight 2026).
Provides high-performance zero-copy SQL analytics over gold parquet tables,
data quality audit logs, and forecast artifacts.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import duckdb
import pandas as pd

logger = logging.getLogger("warehouse")

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DATA_DIR = BASE_DIR / "data"
PROCESSED_DIR = DATA_DIR / "processed"
REPORTS_DIR = BASE_DIR / "reports"
OUTPUTS_DIR = BASE_DIR / "outputs"
WAREHOUSE_PATH = DATA_DIR / "warehouse.duckdb"

GOLD_PARQUET = PROCESSED_DIR / "gold.parquet"
GOLD_FORECASTING_PARQUET = PROCESSED_DIR / "gold_pm25_forecasting.parquet"
DAILY_SUMMARY_PARQUET = PROCESSED_DIR / "daily_station_summary.parquet"
QUALITY_LOG_CSV = REPORTS_DIR / "data_quality" / "quality_log.csv"
LATEST_FORECAST_JSON = OUTPUTS_DIR / "forecasts" / "latest_forecast.json"


class DuckDBManager:
    """Manages DuckDB zero-copy views and persistent analytical tables."""

    def __init__(self, db_path: Optional[Path | str] = None, in_memory: bool = False):
        self.in_memory = in_memory
        if in_memory:
            self.db_path = ":memory:"
        else:
            self.db_path = str(db_path or WAREHOUSE_PATH)
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

        self._con: Optional[duckdb.DuckDBPyConnection] = None

    def connect(self, read_only: bool = False) -> duckdb.DuckDBPyConnection:
        """Connect to DuckDB and register zero-copy views."""
        try:
            if self.in_memory:
                con = duckdb.connect(":memory:")
            else:
                con = duckdb.connect(self.db_path, read_only=read_only)
        except Exception as lock_err:
            logger.warning(f"Could not connect to DuckDB at {self.db_path}: {lock_err}. Falling back to in-memory.")
            con = duckdb.connect(":memory:")

        self._register_views(con)
        return con

    def _register_views(self, con: duckdb.DuckDBPyConnection) -> None:
        """Register views over gold parquet, quality log, and forecasts."""
        # 1. View gold_hourly
        target_gold = GOLD_PARQUET if GOLD_PARQUET.exists() else GOLD_FORECASTING_PARQUET
        if target_gold.exists():
            try:
                con.execute(
                    f"CREATE OR REPLACE TEMP VIEW gold_hourly AS SELECT * FROM read_parquet('{target_gold.as_posix()}');"
                )
            except Exception as e:
                logger.warning(f"Could not register gold_hourly view: {e}")

        # 2. View daily_station_summary (if exists)
        if DAILY_SUMMARY_PARQUET.exists():
            try:
                con.execute(
                    f"CREATE OR REPLACE TEMP VIEW daily_station_summary AS SELECT * FROM read_parquet('{DAILY_SUMMARY_PARQUET.as_posix()}');"
                )
            except Exception as e:
                logger.warning(f"Could not register daily_station_summary view: {e}")

        # 3. View quality_log
        if QUALITY_LOG_CSV.exists():
            try:
                con.execute(
                    f"CREATE OR REPLACE TEMP VIEW quality_log AS SELECT * FROM read_csv('{QUALITY_LOG_CSV.as_posix()}', auto_detect=TRUE, ignore_errors=TRUE);"
                )
            except Exception as e:
                try:
                    q_df = pd.read_csv(QUALITY_LOG_CSV, on_bad_lines="skip", dtype=str)
                    con.register("temp_quality_df", q_df)
                    con.execute("CREATE OR REPLACE TEMP VIEW quality_log AS SELECT * FROM temp_quality_df;")
                except Exception as q_err:
                    logger.warning(f"Could not register quality_log view: {q_err}")

        # 4. View latest_forecasts
        if LATEST_FORECAST_JSON.exists():
            try:
                with open(LATEST_FORECAST_JSON, "r", encoding="utf-8") as f:
                    fc_data = json.load(f)

                # Flatten city records if structured under forecast_data
                cities_data = fc_data.get("forecast_data", {}).get("cities", {})
                flat_rows = []
                for city_name, c_info in cities_data.items():
                    flat_rows.append({
                        "city": city_name,
                        "sensor_id": c_info.get("sensor_id"),
                        "current_pm25": c_info.get("current_pm25"),
                        "predicted_pm25_24h": c_info.get("predicted_pm25_24h"),
                        "lower_80": c_info.get("lower_80"),
                        "upper_80": c_info.get("upper_80"),
                        "status": c_info.get("status"),
                        "generated_at": fc_data.get("generated_at"),
                    })

                if flat_rows:
                    fc_df = pd.DataFrame(flat_rows)
                    con.register("temp_forecasts_df", fc_df)
                    con.execute("CREATE OR REPLACE TEMP VIEW latest_forecasts AS SELECT * FROM temp_forecasts_df;")
            except Exception as f_err:
                logger.warning(f"Could not register latest_forecasts view: {f_err}")

    def query(self, sql: str, params: Optional[List[Any] | Dict[str, Any]] = None) -> pd.DataFrame:
        """Execute query and return pandas DataFrame."""
        con = self.connect(read_only=True)
        try:
            if params:
                return con.execute(sql, params).df()
            return con.execute(sql).df()
        finally:
            con.close()

    def query_pm25(
        self,
        city: Optional[str] = None,
        sensor_id: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        limit: int = 1000,
    ) -> pd.DataFrame:
        """Convenience filter for PM2.5 readings."""
        conditions = []
        params = []

        if city:
            conditions.append("city = ?")
            params.append(city)
        if sensor_id:
            conditions.append("sensor_id = ?")
            params.append(sensor_id)
        if start_time:
            conditions.append("timestamp_utc >= ?")
            params.append(start_time)
        if end_time:
            conditions.append("timestamp_utc <= ?")
            params.append(end_time)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        sql = f"""
            SELECT timestamp_utc, city, sensor_id, pm25, T2M, RH2M, WS10M, pm25_baseline_persistence
            FROM gold_hourly
            {where_clause}
            ORDER BY timestamp_utc DESC
            LIMIT {limit}
        """
        return self.query(sql, params)


def get_connection(read_only: bool = True, db_path: Optional[Path | str] = None) -> duckdb.DuckDBPyConnection:
    """Helper returning a ready-to-query DuckDB connection with pre-registered views."""
    manager = DuckDBManager(db_path=db_path)
    return manager.connect(read_only=read_only)


def build_duckdb_warehouse(db_path: Path = WAREHOUSE_PATH) -> Path:
    """Build or refresh persistent DuckDB warehouse tables."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    try:
        con = duckdb.connect(str(db_path))
    except Exception as lock_err:
        logger.warning(f"Could not connect to DuckDB at {db_path}: {lock_err}")
        return db_path

    tables_created = []

    # 1. Hourly Gold Table (gold_hourly)
    target_gold = GOLD_PARQUET if GOLD_PARQUET.exists() else GOLD_FORECASTING_PARQUET
    if target_gold.exists():
        try:
            con.execute(f"CREATE OR REPLACE TABLE gold_hourly AS SELECT * FROM read_parquet('{target_gold.as_posix()}');")
            cnt = con.execute("SELECT count(*) FROM gold_hourly;").fetchone()[0]
            tables_created.append(("gold_hourly", cnt))
        except Exception as e:
            logger.warning(f"DuckDB gold_hourly sync error: {e}")

    # 2. Daily Station Summary
    if DAILY_SUMMARY_PARQUET.exists():
        try:
            con.execute(f"CREATE OR REPLACE TABLE daily_station_summary AS SELECT * FROM read_parquet('{DAILY_SUMMARY_PARQUET.as_posix()}');")
            cnt = con.execute("SELECT count(*) FROM daily_station_summary;").fetchone()[0]
            tables_created.append(("daily_station_summary", cnt))
        except Exception as e:
            logger.warning(f"DuckDB daily_station_summary sync error: {e}")

    # 3. Quality Log
    if QUALITY_LOG_CSV.exists():
        try:
            q_df = pd.read_csv(QUALITY_LOG_CSV, on_bad_lines="skip", dtype=str)
            con.register("q_df_view", q_df)
            con.execute("CREATE OR REPLACE TABLE quality_log AS SELECT * FROM q_df_view;")
            con.unregister("q_df_view")
            cnt = con.execute("SELECT count(*) FROM quality_log;").fetchone()[0]
            tables_created.append(("quality_log", cnt))
        except Exception as q_err:
            logger.warning(f"DuckDB quality_log sync error: {q_err}")

    con.close()
    logger.info(f"DuckDB warehouse built successfully at {db_path} with {len(tables_created)} tables.")
    return db_path


def query_warehouse(sql: str, params: Optional[List[Any]] = None) -> pd.DataFrame:
    """Convenience functional interface for warehouse queries."""
    manager = DuckDBManager()
    return manager.query(sql, params)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    p = build_duckdb_warehouse()
    con = get_connection()
    count = con.execute("SELECT count(*) FROM gold_hourly").fetchone()[0]
    print(f"DuckDB Warehouse initialized successfully. gold_hourly count: {count:,}")
    con.close()
