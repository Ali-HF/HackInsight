"""
Analytical SQL Query Tool via Embedded DuckDB.
HackInsight 2026 - Insight / RAG Agent Analytical Layer.

Provides fast, grounded zero-copy SQL queries over:
- gold_hourly (gold.parquet)
- quality_log (reports/data_quality/quality_log.csv)
- latest_forecasts (outputs/forecasts/latest_forecast.json)
- daily_station_summary (daily_station_summary.parquet)
"""

from typing import Dict, Any, Optional
import time
import re
from src.data_pipeline.warehouse.duckdb_manager import DuckDBManager


def run_analytical_query(sql_query: str, max_rows: int = 100) -> Dict[str, Any]:
    """
    Execute a read-only analytical SQL query via DuckDB for agent grounding.

    Args:
        sql_query: SELECT query string.
        max_rows: Maximum records to return to prevent prompt bloat.

    Returns:
        Dict with status, row_count, execution_time_ms, columns, and data rows.
    """
    # Guardrail: Only allow read-only SELECT queries
    clean_sql = sql_query.strip()
    disallowed_keywords = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "ATTACH", "DETACH"]
    for kw in disallowed_keywords:
        if re.search(rf"\b{kw}\b", clean_sql, re.IGNORECASE):
            return {
                "status": "error",
                "message": f"Security guardrail: DDL and modification queries ({kw}) are strictly prohibited.",
                "sql_query": clean_sql,
            }

    start_time = time.perf_counter()
    manager = DuckDBManager()

    try:
        df = manager.query(clean_sql)
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        total_rows = len(df)
        limited_df = df.head(max_rows)

        return {
            "status": "success",
            "total_rows_found": total_rows,
            "rows_returned": len(limited_df),
            "execution_time_ms": round(elapsed_ms, 2),
            "columns": list(df.columns),
            "data": limited_df.to_dict(orient="records"),
            "sql_query": clean_sql,
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "sql_query": clean_sql,
        }
