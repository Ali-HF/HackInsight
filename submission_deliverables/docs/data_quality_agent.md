# Data Quality Agent Architecture & Policy Specification
**Project:** PM2.5 Air-Quality Forecasting in Pakistan (HackInsight 2026)  
**Module:** `src.data_pipeline.validation.data_quality_agent`  
**Status:** Implemented & Verified (`REQ-DATA-008`)

---

## 1. Overview & Architecture

The **Data Quality Agent** is an autonomous, deterministic policy engine built on top of the repository's validation tools (`ValidationEngine` and `DataProfiler`). Rather than allowing an LLM to hallucinate over raw tabular data, the agent delegates all numeric checks to deterministic Python validation functions and applies an explicit, auditable decision policy to every detected condition.

```
                           +---------------------------+
                           |  Raw / Processed Dataset  |
                           +-------------+-------------+
                                         |
                                         v
                           +---------------------------+
                           |    DataQualityAgent       |
                           |   (Policy Orchestrator)   |
                           +----+--------+--------+----+
                                |        |        |
        +-----------------------+        |        +------------------------+
        |                                v                                 |
+-------+--------------+  +--------------+-------------+  +----------------+---------------+
|  ValidationEngine    |  |       DataProfiler         |  |   Action Policy Dispatcher     |
| - Schema Checks      |  | - Temporal Continuity      |  | - NO_ACTION (Certified Clean)  |
| - Missingness Checks |  | - Flatline Detection       |  | - FLAG (Preserve & Audit)      |
| - Physical Ranges    |  | - Timeliness & Freshness   |  | - FILL (Bounded Past ffill)    |
| - Key Uniqueness     |  | - Distribution Spikes      |  | - FIX (Deterministic Clean)    |
+----------------------+  +----------------------------+  +--------------------------------+
                                         |
                                         v
                         +---------------+---------------+
                         |   Machine-Readable Audit      |
                         | - quality_log.csv             |
                         | - validation_report.json      |
                         | - agent_quality_assessment.json
                         +-------------------------------+
```

---

## 2. Decision Policy & Semantics

Every observation evaluated against a quality rule yields an explicit action decision belonging to `ActionType`:

| Action | Semantic Definition | When Used | Example Scenarios | Underlying Data Modified? |
| :--- | :--- | :--- | :--- | :--- |
| **`NO_ACTION`** | Observation passes rule verification. Certified clean. | Check completes with 0 violations. | Schema columns present, $PM_{2.5} \in [0, 1500]$, no duplicates. | **No** (`data_modified=False`) |
| **`FLAG`** | Anomaly detected where modification would be scientifically unsafe or ambiguous. | Ground truth cannot be unambiguously determined from physical evidence. | Missing $PM_{2.5}$ target, sensor flatlining ($\ge 6\text{h}$ constant), temporal outage gaps, extreme episodic spikes ($>800\ \mu\text{g}/\text{m}^3$). | **No** (`data_modified=False`) |
| **`FILL`** | Defensible deterministic imputation for non-target meteorological covariates. | Missing covariate gap $\le 2\text{h}$ within continuous stream; backward-looking only. | Isolated 1-hour null in NASA POWER ambient temperature (`T2M`) filled with past value (`ffill(limit=2)`). | **Yes** if remediation enabled (`data_modified=True`) |
| **`FIX`** | Unambiguous deterministic normalization of technical or formatting artifacts. | Mathematical/logical ground truth is known with certainty. | String whitespace trimming, exact duplicate row deduplication (retaining earliest record). | **Yes** if remediation enabled (`data_modified=True`) |

---

## 3. Strict Safety Principles

1. **No Target Imputation / Fabrication:**
   Under no circumstances does the agent impute or synthesize missing values in the forecasting target (`pm25_target_24h` or `pm25`). All target missingness is strictly `FLAGGED`.
2. **Zero Lookahead Leakage:**
   Remediation rules (`FILL`) use strictly backward-looking forward-fill (`ffill` with max limit 2 hours). Future observations are never accessed.
3. **Preservation of Raw Scientific Measurements:**
   Physically impossible readings (e.g. negative values or values $>1500\ \mu\text{g}/\text{m}^3$) are **never** clipped or smoothed silently. They are retained and `FLAGGED` with critical/warning severity for domain-expert review.
4. **Preference for `FLAG` over Unsafe Remediation:**
   Whenever safe conditions for `FIX` or `FILL` are unmet, the agent falls back to `FLAG`.

---

## 4. Quality Rules Implemented

| Rule ID | Check Name | Threshold / Condition | Default Action | Severity |
| :--- | :--- | :--- | :--- | :--- |
| `DQ-SCH-001` | Schema Completeness | All 16 contract columns present | `NO_ACTION` / `FLAG` | critical |
| `DQ-FIX-001` | String Whitespace | Untrimmed leading/trailing whitespace | `FIX` / `FLAG` | info / warning |
| `DQ-DUP-001` | Identifier Uniqueness | Duplicate `record_id` (identical vs conflicting) | `FIX` (identical) / `FLAG` (conflicting) | info / critical |
| `DQ-NULL-001`| Target Missingness | Missing `pm25` or `pm25_target_24h` | `FLAG` (no fill allowed) | critical |
| `DQ-FILL-001`| Covariate Missingness | Null meteorological covariates (`T2M`, `RH2M`, etc.) | `FILL` ($\le 2\text{h}$) / `FLAG` ($> 2\text{h}$) | info / warning |
| `DQ-RNG-001` | $PM_{2.5}$ Physical Range | Values outside $[0.0, 1500.0]\ \mu\text{g}/\text{m}^3$ | `FLAG` | critical / warning |
| `DQ-RNG-002` | Temperature Range | Values outside $[-10.0, 60.0]^\circ\text{C}$ | `FLAG` | critical |
| `DQ-RNG-003` | Relative Humidity | Values outside $[0.0, 100.0]\%$ | `FLAG` | critical |
| `DQ-TMP-001` | Temporal Continuity | Time gap $> 1\text{h}$ between consecutive readings | `FLAG` | warning |
| `DQ-FLT-001` | Sensor Flatlining | Identical $PM_{2.5}$ for $\ge 6$ consecutive hours | `FLAG` | warning |
| `DQ-TIM-001` | Timeliness & Freshness | Timestamp valid and parseable in ISO UTC | `NO_ACTION` / `FLAG` | info / critical |
| `DQ-DST-001` | Distribution Spikes | $PM_{2.5} > 800\ \mu\text{g}/\text{m}^3$ single-hour spike | `FLAG` | warning |

---

## 5. Audit Trail & Artifacts

All agent assessments generate structured, persistent audit trails:

1. **Persistent CSV Log:** `reports/data_quality/quality_log.csv`
   - Fields: `timestamp_utc,rule_id,action,records_checked,records_affected,severity,rationale`
   - Records every action taken or anomaly flagged across runs.
2. **Standard Validation Report:** `reports/data_quality/validation_report.json`
   - Provides summary status (`PASS`, `WARN`, `FAIL`), individual check findings, actions summary, and recommendations.
3. **Agent Assessment Specification:** `reports/data_quality/agent_quality_assessment.json`
   - Contains complete decision-level audit data with timestamps, check IDs, affected record counts, and remediation flags.

---

## 6. How to Run

### Via the Quality Agent Module:
```bash
python -m src.data_pipeline.validation.data_quality_agent \
  --input data/processed/gold_pm25_forecasting.parquet
```

With safe remediation enabled:
```bash
python -m src.data_pipeline.validation.data_quality_agent \
  --input data/processed/gold_pm25_forecasting.parquet \
  --auto-remediate
```

### Via Pipeline CLI:
```bash
python -m src.data_pipeline.cli quality-agent
```

### Running the Test Suite:
```bash
pytest tests/unit/test_data_quality_agent.py -v
```

---

## 7. Known Limitations

1. **Low-Cost Sensor Noise:**
   Optical sensors in humid conditions can report elevated particulate counts due to hygroscopic droplet growth. The agent flags high values ($>800\ \mu\text{g}/\text{m}^3$) but does not calibrate optical gain factors.
2. **Spatial Imputation:**
   The current agent evaluates temporal continuity per sensor independently. Multi-station cross-sensor spatial kriging / spatial interpolation is not performed to avoid introducing synthetic correlation assumptions.
