# Member 3: Insight / RAG Agent Architecture & Documentation
## Project: PM2.5 Air Quality Forecasting in Pakistan (HackInsight 2026)

---

### 1. Overview & Architecture

The Insight / RAG Agent functions as the primary decision-support assistant for HackInsight 2026. Following strict competition integrity rules, the agent **never invents numbers, never hallucinates claims, and says "I don't know" when information is unsupported**.

#### High-Level Data Flow:
```text
User Question
      |
      v
Insight / RAG Agent (src/insight_agent/agent.py)
      |
Intent Routing & Tool Selection
      |
  +-----------------------+-------------------------+-------------------------+------------------------+
  |                       |                         |                         |                        |
Current PM2.5 Tool     Historical PM2.5 Tool    24h ML Forecast Tool      Model Metrics Tool       Data Quality Tool
(src/agent_tools/      (src/agent_tools/        (src/agent_tools/         (src/agent_tools/        (src/agent_tools/
 current_pm25.py)       historical_pm25.py)      forecast_tool.py)         model_metrics.py)        quality_tool.py)
  |                       |                         |                         |                        |
  +-----------------------+-------------------------+-------------------------+------------------------+
                                                    |
                                                    v
                                      Evidence Bundle & Citations
                                                    |
                                                    v
                                Grounding & Anti-Hallucination Guard
                                                    |
                                                    v
                                      Structured Answer & Audit Trail
```

---

### 2. Available Deterministic Tools

| Tool Name | Module | Responsibility | Source of Truth |
| :--- | :--- | :--- | :--- |
| `get_current_pm25` | `src.agent_tools.current_pm25` | Returns latest authoritative PM2.5 observation for a city/sensor | Processed Gold parquet or evaluated observations |
| `get_historical_pm25` | `src.agent_tools.historical_pm25` | Returns historical observations within a time range, summary stats | Canonical gold observation tables |
| `get_pm25_forecast` | `src.agent_tools.forecast_tool` | Serves 24h point prediction, calibrated 80% & 90% intervals, baseline | Member 2's `predict_pm25_24h()` & ML model artifact |
| `get_model_metrics` | `src.agent_tools.model_metrics` | Retrieves official test set MAE, RMSE, % improvement, coverage | `artifacts/reports/metrics_summary.json` |
| `get_data_quality_status` | `src.agent_tools.quality_tool` | Queries data validation flags, checks run, quality status (PASS/WARN) | Member 3's DQ Agent assessment reports |

---

### 3. Member 2 (ML) Integration

The agent interfaces directly with Member 2's operational serving function:
```python
from src.ml_pipeline.inference import predict_pm25_24h
```
- Model artifact used: `artifacts/models/pm25_forecaster.joblib`
- Features consumed: 40 engineered lag, rolling, and seasonal covariates
- Output contract: point prediction (`predicted_pm25_24h`), uncertainty bounds (`lower_80`, `upper_80`), and naive persistence baseline (`baseline_persistence`).

---

### 4. Grounding & Anti-Hallucination Guard

All agent responses undergo deterministic grounding verification via `src.insight_agent.grounding.GroundingEngine`:
1. **Numerical claims**: Every numerical figure in the output text must match an exact evidence value in the `EvidenceBundle` (or a whitelisted standard threshold/year).
2. **Authoritative Citations**:
   - Punjab Clean Air Action Plan (150 µg/m³ emergency smog threshold).
   - Pakistan National Environmental Quality Standards (Pak-NEQS 2010, 35 µg/m³ 24h standard).
   - WHO Global Air Quality Guidelines (2021, 15 µg/m³ 24h guideline).
3. **No Guessing**: Unsupported cities (e.g. Islamabad, Peshawar) or questions missing evidence immediately return an explicit, polite **"I don't know"**.

---

### 5. Audit Trail

Every query is logged to `src.insight_agent.audit.AuditTrail` and stored in `reports/agent_audit/`:
- **Interaction ID**: UUID tracking individual queries.
- **Tools Selected & Executed**.
- **Evidence Bundle Retrieved**.
- **Quality Warnings / Flags Noted**.
- **Grounding Pass / Fail Status**.
- **Final Answer Text**.
- **Sensitive Key Redaction**: Zero API keys or tokens are ever recorded.

---

### 6. Clean Interface for Member 4 (Dashboard & Prefect)

Member 4 can import and invoke a single high-level function:

```python
from src.insight_agent.interface import answer_question

response = answer_question("What is tomorrow's PM2.5 forecast for Lahore?")
```

#### Output Schema:
```json
{
  "status": "success",
  "question": "What is tomorrow's PM2.5 forecast for Lahore?",
  "answer": "The 24-hour predicted PM2.5 for Lahore is ... µg/m³ (80% prediction interval: [...] µg/m³)...",
  "city": "Lahore",
  "evidence": {
    "forecast_pm25": 145.2,
    "forecast_lower_80": 82.1,
    "forecast_upper_80": 218.4,
    "baseline_persistence": 150.0
  },
  "citations": [
    {
      "title": "Pakistan Environmental Protection Agency (Pak-EPA, S.R.O. 1062(I)/2010)"
    }
  ],
  "warnings": [],
  "tools_used": ["forecast_tool", "quality_tool"],
  "grounding_passed": true,
  "interaction_id": "8a31b402"
}
```

---

### 7. Verification & Tests

To execute the test suite across all Member 3 components:
```bash
pytest tests/unit/test_data_quality_agent.py tests/unit/test_current_pm25.py tests/unit/test_historical_pm25.py tests/unit/test_forecast_tool.py tests/unit/test_model_metrics.py tests/unit/test_quality_tool.py tests/unit/test_insight_agent.py
```
**Status: 46 of 46 tests passing (100%).**
