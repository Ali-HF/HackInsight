# Requirement Traceability Matrix (RTM)
## Project: PM2.5 Air-Quality Forecasting in Pakistan (HackInsight 2026)
**Owner:** Member 1 — Data Engineering & Data Quality  
**Status:** In Progress (Audit & Foundation Phase)

| Requirement ID | Official Requirement / Summary | Source Reference | Proposed Implementation Location | Verification Method | Status | Evidence Location |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-DATA-001** | At least 2 independent credible sources, including at least 1 off-track source | Guide Sec 4 (p. 3); Declaration Sec 2, 3 | `src/data_pipeline/ingestion/` | Source registration audit & schema validation | **VERIFIED** | `docs/data_source_register.md`, `DATASET_DECLARATION.md` |
| **REQ-DATA-002** | Minimum volume: 50,000+ rows, 2+ years of hourly data, or 5,000+ docs | Guide Sec 4 (p. 3); Declaration Sec 4 | `src/data_pipeline/ingestion/` | Ingestion row count test | **VERIFIED** | `paqi_inspection_report.md` (Lahore: 479k, Karachi: 143k readings; 32k hours) |
| **REQ-DATA-003** | Immutable raw layer: files preserved exactly as fetched, never edited by hand | Guide Sec 5 (p. 4); Workflow Sec 7 | `data/raw/` | SHA-256 recalculation test | **IMPLEMENTING** | `data/manifests/manifest.csv` |
| **REQ-DATA-004** | Cryptographic Manifest: record source, query, fetch time (UTC), SHA-256, license | Guide Sec 4 (p. 3); Workflow Sec 7 | `src/data_pipeline/provenance/manifest.py` | Manifest schema test against `schemas/manifest.schema.json` | **PENDING** | `data/manifests/manifest.csv` |
| **REQ-DATA-005** | Three warehouse layers: Raw, Cleaned, Processed (Gold) | Guide Sec 5 (p. 4); Workflow Sec 6 | `data/{raw,cleaned,processed}/` | Directory existence & non-empty tests | **PENDING** | `docs/data_engineering_plan.md` |
| **REQ-DATA-006** | Single rebuild command: `make data` rebuilds raw -> cleaned -> gold with no manual steps | Guide Sec 5 (p. 4); Workflow Sec 15 | `Makefile`, `src/data_pipeline/cli.py` | CLI integration test from clean workspace | **PENDING** | `Makefile`, `tests/integration/test_make_data.py` |
| **REQ-DATA-007** | Timezone integrity: Store in UTC, convert to PKT only for display | Guide Sec 5 (p. 4); Workflow Sec 9 | `src/data_pipeline/cleaning/time_alignment.py` | Timezone parser unit test | **PENDING** | `tests/unit/test_timestamps.py` |
| **REQ-DATA-008** | Data Quality Agent engine: FIX, FILL, FLAG actions with reason, rule ID, and row count | Guide Sec 6 (p. 4); Workflow Sec 11, 13 | `src/data_pipeline/validation/quality_engine.py` | Quality action test & audit log verification | **PENDING** | `reports/data_quality/quality_log.csv` |
| **REQ-DATA-009** | Machine-readable validation reports (schema, missingness, ranges, duplicates, drift) | Guide Sec 6 (p. 4); Workflow Sec 12 | `src/data_pipeline/validation/report_generator.py` | Validation report schema check against JSON schema | **PENDING** | `reports/data_quality/validation_report.json` |
| **REQ-DATA-010** | Leakage prevention: strictly no lookahead features in forecasting gold tables | Guide Sec 5, 7; Workflow Sec 10 | `src/data_pipeline/processing/gold_builder.py` | Feature cutoff & temporal split test | **PENDING** | `tests/unit/test_leakage.py` |
| **REQ-DATA-011** | Gold dataset stable row identifiers: unique composite observation key | Guide Sec 5 (p. 4); Workflow Sec 14 | `src/data_pipeline/processing/gold_builder.py` | Uniqueness assertion on `record_id` | **PENDING** | `tests/unit/test_gold_schema.py` |
| **REQ-DATA-012** | Offline / fixture testability: run tests without live network access | Workflow Sec 16, 20 (Prompt 2) | `tests/fixtures/` | Pytest runner with disabled network access | **PENDING** | `tests/` |
