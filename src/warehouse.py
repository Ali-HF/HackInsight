"""
DuckDB Data Warehouse Interface (HackInsight 2026 - Reference Compatibility).
Directly proxies to src.data_pipeline.warehouse.duckdb_manager.
"""

import sys
from pathlib import Path

# Ensure project root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.data_pipeline.warehouse.duckdb_manager import (
    DuckDBManager,
    build_duckdb_warehouse,
    get_connection,
    query_warehouse,
    WAREHOUSE_PATH,
)

__all__ = [
    "DuckDBManager",
    "build_duckdb_warehouse",
    "get_connection",
    "query_warehouse",
    "WAREHOUSE_PATH",
]

def main():
    build_duckdb_warehouse()

if __name__ == "__main__":
    main()
