# AI USE LOG: HACKINSIGHT 2026 (TECHFEST '26)
**Team:** DataMinors  
**Members:** Ali Hasan Farooqui, Laiba Akram, Areeba, Bushra Abid  
**Track:** Air Quality (Lahore & Karachi PM2.5 Hourly Forecasting)  
**Repository:** [Ali-HF/HackInsight](https://github.com/Ali-HF/HackInsight)  
**Declared:** Mon 19 Oct 2026 – Wed 21 Oct 2026  

---

## 1. Compliance Statement
In strict adherence to **Section 12 ("Rules of conduct and AI use")** and **Section 13 ("Final submission checklist")** of the HackInsight Participant Guide:
1. **No Artificial Data Generation:** No synthetic or AI-generated data was used for model training or benchmark evaluation.
2. **Grounding & Transparency:** Generative AI was not permitted to invent numerical measurements; all insight metrics derive directly from the gold dataset and evaluated prediction outputs.
3. **Full Disclosure:** All material use of AI coding assistants, foundational LLMs, and development tools is recorded in the table below.

---

## 2. Material AI Tooling Disclosures

| Tool & Version | Project Task / Module | What Was Kept vs. Changed | Verifying Member |
|---|---|---|---|
| **Google Antigravity IDE / Gemini 2.5** | Tier 1: Schema validation & DataQualityAgent rule scaffolds | Auto-generated skeleton rule structures. Manually edited deterministic threshold logic (FIX, FILL, FLAG, NO_ACTION), bounded ffill limits (max 2h), and audit trail logging. | Ali Hasan Farooqui |
| **Google Antigravity IDE / Gemini 2.5** | Tier 2: Chronological feature engineering & HistGradientBoosting pipeline | Proposed lag and rolling window features. Manually restricted features to strictly causal ($t \le 0$) windows, verified quantile residual calibration on validation set, and enforced zero lookahead leakage. | Laiba Akram |
| **LangChain / OpenAI GPT-4o-mini** | Tier 3: Insight / RAG Agent synthesis & user Q&A | AI used strictly for text natural language synthesis and intent routing. All factual numbers are extracted via Python tools from gold tables; statutory citations (Pak-EPA NEQS 2010, WHO 2021) are hard-coded in lookup tables. | Areeba |
| **Prefect 3.1.13 Assistant** | Tier 4: Hourly flow orchestration & concurrency locking | Generated skeleton Prefect flow tasks. Implemented custom `ConcurrencyLock`, task retry parameters (3 retries, 5s delay), and atomic JSON output publishing. | Bushra Abid |
| **Vite / React 19 / Three.js** | Tier 4: Web presentation layer & 3D Atmospheric Globe | Assistant scaffolded Three.js WebGL canvas and Tailwind layout. Refined interactive rotation, coordinate pins for Lahore/Karachi, and Framer Motion micro-interactions. | Bushra Abid / Team |

---

## 3. Disqualification Guardrail Invariants
- **No Hard-coded Outputs:** All metrics, forecasts, and status badges are dynamically calculated from data and model artifacts.
- **No Leaked Test Data:** The test partition (49,116 rows) was quarantined and evaluated strictly post-training.
- **Code Explainability:** Every team member is prepared to explain the technical implementation and line-by-line logic during the physical viva.
