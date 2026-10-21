# Air Quality Forecasting Competition --- Agent Context

> **Purpose:** This file gives an AI coding agent the project context
> discussed so far. Use it as the working brief when helping plan,
> implement, review, or explain the project.
>
> **Important:** This document summarizes the conversation, not a fresh
> verification of the competition guide. Treat details such as scoring,
> exact deliverables, schedule, and mandatory tools as requirements
> reported in the conversation; verify them against the official
> participant guide before relying on them. Do not pretend that data
> sources, files, models, agents, or pipelines already exist unless the
> user confirms they do.

------------------------------------------------------------------------

## 1. Project in one sentence

Build a **trustworthy, reproducible, evidence-backed PM2.5 air-quality
forecasting and decision-support system** for Lahore and/or Karachi,
Pakistan, that predicts PM2.5 roughly 24 hours ahead, reports
uncertainty and model limitations, explains results using traceable data
and trusted documents, and can be run and monitored automatically.

The goal is **not to claim that AI itself will eliminate air
pollution**. The goal is to help a human decision-maker understand
likely conditions and prioritize attention, warnings, or further
investigation.

### Core user question

> "What is PM2.5 likely to be tomorrow, where, how confident are we,
> what evidence supports this, and what are the limitations?"

### Intended user and decision

A plausible user is an environmental officer or another responsible
decision-maker. The system should help them prioritize locations or
investigate possible elevated pollution. The team must explicitly define
the actual target user, decision, and use case rather than leaving these
vague.

Do not make unsupported health, causal, or policy claims. A PM2.5
forecast alone does not prove that a particular weather variable caused
pollution or that a particular intervention will reduce it.

------------------------------------------------------------------------

## 2. High-level architecture

The intended conceptual flow is:

``` text
External data sources
        |
        v
Raw, immutable source files + source manifest
        |
        v
Cleaning and normalization
        |
        v
Validation and data-quality report
        |
        v
Data Quality Agent: FIX / FILL / FLAG + explanation + audit log
        |
        v
Processed / gold dataset with stable row IDs
        |
        v
Feature engineering
        |
        v
Time-aware training and evaluation
        |
        v
24-hour-ahead PM2.5 forecast + uncertainty
        |
        v
Evidence-backed Insight Agent (retrieval + tools + citations)
        |
        v
Dashboard / decision-support interface
        |
        v
Human decision
```

An orchestrator such as Prefect may coordinate the steps on a schedule,
record run status, and expose failures. The exact technology choices
should be checked against the official competition requirements and the
team's current implementation.

### The product is more than the ML model

The model is one component. The whole product should make it possible to
answer:

-   Where did the input data come from?
-   What happened to it during cleaning?
-   What quality issues were found and how were they handled?
-   How was the model evaluated?
-   How uncertain is the forecast?
-   Does performance vary by city, season, or other meaningful group?
-   Which exact rows and trusted sources support each displayed claim?
-   Can the process be reproduced and monitored?

------------------------------------------------------------------------

## 3. Data sources and data integrity

Potential sources mentioned in the conversation include:

-   **PAQI** data.
-   **NASA POWER** weather/environmental data.
-   Potential live or additional sources, if available and appropriately
    licensed.

These are candidate sources, not proof that a working integration
already exists. Before implementation, verify the exact source endpoint,
geographic coverage, temporal resolution, available fields, data access
method, terms/licence, and whether the data can support the desired
forecast.

### Source selection questions

For each source, document:

1.  Publisher and source name.
2.  Exact URL/API/query or retrieval method.
3.  Location coverage and station/sensor identifiers.
4.  Time range, temporal resolution, units, and timezone.
5.  Which fields are measured versus derived.
6.  Fetch time and data freshness.
7.  Licence/terms and attribution requirements.
8.  Known limitations, missing periods, sensor coverage, and
    reliability.
9.  Whether it is appropriate for the intended use.

Do not assume a source provides hourly readings, current data, all
required cities, or a particular licence without checking.

### Immutable raw layer

Raw files are the evidence of what was received. Save them without
editing. If correction is necessary, create a cleaned derivative rather
than changing the original.

For each raw file, a manifest may record:

-   Stable file ID/path.
-   Source and query/endpoint.
-   Retrieval timestamp.
-   Coverage period if known.
-   SHA-256 checksum.
-   Licence/terms.
-   Format, size, and relevant notes.

A checksum helps detect whether a file changed; it does not by itself
prove that the original source is accurate.

Suggested conceptual layers:

``` text
data/
  raw/          # Original source files; do not edit
  cleaned/      # Parsed, normalized, quality-handled data
  processed/    # Model-ready features/targets and stable row IDs
```

Use the repository's existing conventions if already established rather
than blindly creating duplicate directories.

------------------------------------------------------------------------

## 4. Reproducible data pipeline

A **pipeline** is an ordered sequence of data-processing steps. A
**reproducible** pipeline means another person can rerun documented code
and obtain the derived outputs without hidden manual steps.

A conceptual pipeline:

1.  Retrieve source data (or use explicitly versioned local snapshots
    when offline).
2.  Save source files to the raw layer.
3.  Record metadata and checksums in a manifest.
4.  Parse files and standardize column names/types.
5.  Normalize units and timezones.
6.  Detect duplicate or malformed records.
7.  Validate schema, ranges, missingness, freshness, and other rules.
8.  Apply only justified cleaning/imputation rules and preserve flags.
9.  Join sources carefully using compatible locations and timestamps.
10. Create features and forecast targets without leakage.
11. Save processed data with stable row identifiers.
12. Produce machine-readable reports and logs.

The conversation referred to a `make data` command that rebuilds
raw/cleaned/processed layers. Treat this as a reported competition
requirement to verify. If required, the command should be deterministic
and documented. It should not silently depend on manual spreadsheet
edits or undeclared local state.

### Raw vs cleaned vs processed/gold

-   **Raw:** what was received from a source, preserved as evidence.
-   **Cleaned:** parsed and normalized data with issues handled or
    explicitly flagged.
-   **Processed/gold:** the canonical analysis/model-ready dataset, with
    features, targets, and stable row IDs. This is also the preferred
    source for values shown in the dashboard and Insight Agent.

Do not overwrite raw data. Keep a record of transformations and
meaningful changes.

------------------------------------------------------------------------

## 5. Data cleaning vs data validation

These are related but different.

### Cleaning asks: "Can we correct this known issue safely?"

Examples: - Parse a timestamp into a consistent datetime type. - Convert
a temperature from Kelvin to Celsius when the unit is known. -
Standardize known unit variants. - Remove a confirmed duplicate under a
documented rule. - Correct a malformed field when the intended value can
be established.

### Validation asks: "Does this record or dataset satisfy declared quality rules?"

Examples: - Required columns are present. - Types and units are as
expected. - PM2.5 values are not impossible under the chosen data
definition. - Timestamp order and frequency are plausible. - Duplicate
keys are absent or accounted for. - Missingness and staleness are within
declared limits. - Sensor/source values have not shifted unexpectedly.

A validation failure does **not** automatically mean the system should
alter the value. It may be safer to flag it, quarantine it, or reject
it.

### Critical pollution-data caution

Do not blindly delete every high PM2.5 value as an "outlier." Severe
pollution can be real. Distinguish sensor errors from unusual but
plausible events. Use source documentation, physical/domain checks,
robust diagnostics, and transparent rules. Preserve original values and
log any exclusion or correction.

### Missing values

Do not automatically fill long gaps. Any imputation must be justified,
documented, and marked. For example, a very short gap might be eligible
for a carefully chosen interpolation method in some contexts, while a
multi-day outage should usually be flagged rather than filled with
invented observations. The correct policy depends on the data frequency,
model, and validation results.

------------------------------------------------------------------------

## 6. Data Quality Agent

The Data Quality Agent is intended to be more than a static list of
checks. It should use validation tools/results, select an appropriate
action, explain why, and record an auditable decision.

### Core loop

``` text
Inspect dataset / run validation tools
              |
              v
Collect structured findings
              |
              v
Decide a permitted action
              |
              v
Apply action only when safe
              |
              v
Revalidate
              |
              v
Write structured audit log
```

### Action vocabulary

-   **FIX:** Apply a correction when the intended value or
    transformation is known with sufficient confidence.
-   **FILL:** Impute a missing value only under a documented, defensible
    rule; mark the value as imputed.
-   **FLAG:** Preserve the questionable data and record the problem when
    safe correction is not justified.

These actions should be constrained by code and policy, not left to
unrestricted LLM improvisation.

### Illustrative cases

-   Known unit mismatch: convert using a documented rule, then log the
    conversion.
-   Small, eligible data gap: fill only if the approved policy allows it
    and add an imputation flag.
-   Multi-day sensor outage: flag the gap rather than inventing a long
    series of values.
-   Suspiciously extreme PM2.5: investigate and flag for review rather
    than automatically deleting it.
-   Unknown unit or ambiguous timestamp: flag/quarantine until resolved
    rather than guessing.

### Recommended structured log fields

A `quality_log` could include:

-   Run ID and timestamp.
-   Dataset/file and stable row ID(s).
-   Rule/check name and version.
-   Issue category and severity.
-   Observed value or summary (avoid unnecessary sensitive data).
-   Action: `FIX`, `FILL`, `FLAG`, or `NO_ACTION`.
-   Before/after values where relevant.
-   Reason and evidence.
-   Whether the action was automatic or requires human review.
-   Validation result after action.

The agent should not hide failures. It should summarize counts found,
fixed, filled, flagged, and unresolved. Store enough detail to audit
decisions.

------------------------------------------------------------------------

## 7. ML forecasting task

### Target

The intended task is **forecast PM2.5 approximately 24 hours ahead** for
the chosen city/station/location, depending on what the source data can
support.

Conceptually:

``` text
Input: information available at forecast issue time t
Target: PM2.5 at time t + 24 hours
```

Define the target precisely before coding: units, station/location
aggregation, timezone, forecast issue time, target timestamp, and how
missing target observations are handled.

### Potential features

Only use features genuinely available at the forecast issue time, such
as:

-   Recent PM2.5 values and lags.
-   Rolling summaries calculated using past observations only.
-   Hour/day/month or seasonal indicators.
-   Weather variables, if available at prediction time and appropriately
    aligned.
-   Location/station metadata, if useful and permitted.

Possible lag examples: - PM2.5 one time step ago. - PM2.5 24 hours
ago. - PM2.5 one week ago. - Rolling mean over a past-only window.

These are conceptual examples; choose lags that match the actual data
frequency.

### Baseline

Always compare the ML model with a simple, clearly specified baseline. A
possible persistence baseline is:

``` text
Forecast PM2.5 at t+24 = latest observed PM2.5 at t
```

This is only an example. The baseline must be adapted to the sampling
frequency and forecast definition. A sophisticated model that does not
outperform a sensible baseline may not add value.

### Evaluation

Use chronological/time-aware splitting, not a random split that leaks
future information into training. Keep the final test period untouched
until the model and decisions are finalized. Fit preprocessing steps
only on training data, then apply the fitted transformations to
validation/test data.

Report appropriate metrics, for example: - **MAE:** average absolute
prediction error; usually easier to interpret in PM2.5 units. -
**RMSE:** gives more weight to larger errors.

Do not report only one aggregate metric. Inspect residuals and
performance by meaningful groups, such as city/station and season, when
the sample size supports it. Explain small-sample limitations.

### Leakage risks

Avoid: - Using future PM2.5 values in features. - Rolling windows that
include the target or later timestamps. - Randomly splitting highly
time-dependent observations. - Fitting scalers/imputers on the full
dataset before splitting. - Joining future weather observations that
would not actually have been available at forecast time, unless the
operational setup legitimately includes a weather forecast and it is
clearly distinguished from observed weather.

Record the forecast issue time and data cutoff so a prediction can be
reproduced.

------------------------------------------------------------------------

## 8. Uncertainty

A forecast is not a guaranteed exact future measurement. The system
should communicate uncertainty rather than presenting a single number as
certain.

Illustrative UI:

``` text
Forecast PM2.5: 180 µg/m³
Prediction interval: 155–205 µg/m³
```

These numbers are examples only, not real predictions.

The interval must come from a defensible method, such as a validated
quantile model, residual-based interval, or another suitable calibration
approach. State what the range means and how it was evaluated. Do not
invent an interval merely to make the interface look complete.

A narrow interval suggests greater estimated certainty; a wide interval
suggests more uncertainty. Verify empirical coverage on held-out time
periods where feasible. Explain that even a calibrated interval does not
guarantee the future value will fall inside it.

------------------------------------------------------------------------

## 9. Group analysis and failure reporting

A single overall metric can hide poor performance in particular
locations or conditions.

Potential comparisons: - Lahore vs Karachi, if both are actually
included. - Individual stations or sensors, if data supports
station-level evaluation. - Winter, summer, monsoon, or other
scientifically justified periods. - Low vs high pollution ranges. -
Different forecast horizons, if more than one is evaluated.

Do not claim that the model works equally well everywhere unless results
support it. Report sample counts along with group metrics, and be
cautious about drawing conclusions from small groups.

The system should make known weaknesses visible to the user.

------------------------------------------------------------------------

## 10. Insight Agent and RAG

The Insight Agent is intended to turn verified model outputs and trusted
evidence into understandable explanations.

**RAG** means Retrieval-Augmented Generation. At a high level:

1.  Receive a user question.
2.  Retrieve relevant processed data rows and/or approved reference
    documents.
3.  Call tools that return authoritative structured results where
    appropriate.
4.  Give the LLM only the relevant evidence and clear instructions.
5.  Generate an explanation that separates observed facts, model
    forecasts, and interpretation.
6.  Attach citations/row references.
7.  Decline to make claims unsupported by the retrieved evidence.

### Example question

> "Why is Lahore expected to have elevated PM2.5 tomorrow?"

The system might retrieve: - The actual forecast record and its row/run
IDs. - Supporting weather observations or forecasts that were available
at prediction time. - Approved public guidance documents with source
metadata.

The answer may describe associations or contextual evidence, but it must
not claim that weather definitively caused the predicted pollution
unless the analysis supports causality.

### Numbers must come from tools/data, not LLM invention

A key design principle from the conversation:

-   Forecast numbers come from the saved model prediction/processed
    output.
-   Metrics come from recorded evaluation results.
-   Data-quality counts come from the quality report/log.
-   Each numerical result should be traceable to a stable record or run.
-   The LLM explains these values; it must not fabricate them.

The agent should use a structured data tool/API or query function to
fetch the relevant record. Do not rely on an LLM to remember or guess a
value.

### Citations and traceability

For every displayed forecast, where practical show: - City/station. -
Forecast issue time. - Target time. - Prediction and units. - Interval
and its meaning. - Model/version or run ID. - Source row/record IDs. -
Data freshness/quality status.

For documentary claims, cite the exact approved source/document and
relevant section or passage. Do not invent citations or use a citation
that does not support the claim.

### Unsupported questions

If a question asks for something not covered by available data, the
system should clearly say it cannot determine that from the available
evidence. Example:

> "The available data does not support a reliable estimate of that
> outcome."

Do not infer a percentage change in respiratory cases, prove a policy
intervention will work, or answer other unsupported questions from PM2.5
forecasts alone.

### Keep the agent bounded

Use explicit tools, schemas, allowed sources, and validation. The LLM
should not be allowed to write arbitrary forecast values into the
official result store. It should not bypass quality checks or make
operational decisions autonomously. Present decision support to a human.

------------------------------------------------------------------------

## 11. Automation and orchestration (e.g., Prefect)

The conversation described an hourly workflow managed by Prefect.
Confirm the exact cadence and tool requirements from the official guide
before implementation.

A possible scheduled flow:

``` text
Scheduled trigger
      |
      v
Fetch/refresh source data
      |
      v
Save raw files + manifest
      |
      v
Clean and validate
      |
      v
Run quality-agent decisions
      |
      v
Build features
      |
      v
Generate forecast
      |
      v
Save prediction + uncertainty + lineage
      |
      v
Refresh dashboard/API
      |
      v
Record run status, duration, and errors
```

### What the orchestrator does

An orchestrator coordinates tasks, ordering, dependencies, retries,
schedules, and run history. It does not replace the actual
data-processing/model code.

It should make it easy to inspect: - Successful and failed runs. -
Start/end time and duration. - Which task failed. - Logs and error
details. - Input data versions and output artifacts. - Whether the
dashboard is showing a fresh or stale forecast.

### Reliability considerations

-   Never silently show an old prediction as if it were fresh.
-   If a fetch or model run fails, preserve the last valid output but
    label it stale and show its timestamp.
-   Add sensible retries for transient failures.
-   Avoid duplicate or partially written outputs.
-   Make reruns safe/idempotent where possible.
-   Keep secrets/API keys out of source control and logs.
-   Do not fabricate a "successful hourly run" if the flow was not
    actually scheduled and executed.

------------------------------------------------------------------------

## 12. Dashboard / user interface

The dashboard should answer the user's main question quickly and expose
enough evidence to support trust.

Possible components: 1. City/station selector. 2. Current/latest
observed PM2.5, clearly distinguished from forecasts. 3. 24-hour-ahead
PM2.5 forecast and units. 4. Prediction interval and a short explanation
of uncertainty. 5. Forecast issue time, target time, and freshness
indicator. 6. Data-quality status and recent unresolved issues. 7. Model
performance vs baseline. 8. Group/season performance and known
limitations. 9. Evidence-backed Insight Agent explanation with
citations. 10. Traceability details such as run ID, model version, row
IDs, and source links. 11. Clear failure/stale-data state.

Avoid presenting forecasts as official measurements. Label measured,
estimated, forecast, and imputed values distinctly. The dashboard
supports human judgment; it should not imply that the system
automatically makes official policy decisions.

------------------------------------------------------------------------

## 13. Trustworthiness: what must be demonstrated

"Trustworthy results" means more than a good metric. The team should be
able to trace the result through the full chain:

``` text
Dashboard forecast
  -> saved prediction record / model run
  -> model version and evaluation
  -> processed/gold row IDs and feature definitions
  -> cleaned data and transformation code
  -> original raw files and checksums
  -> source metadata and licence
```

Also demonstrate: - Data validation results and unresolved issues. -
Logged `FIX` / `FILL` / `FLAG` actions. - Chronological train/test
design and leakage controls. - Baseline comparison. - Uncertainty
calibration/validation. - Performance differences across relevant
groups. - Insight Agent citations and refusal/uncertainty on unsupported
questions. - Automation run history and honest reporting of failures.

A checksum proves file integrity relative to the recorded hash, not
factual accuracy. A citation proves traceability only if it actually
supports the claim. An agent label does not prove that a workflow is
agentic; demonstrate real tool use, bounded decisions, explanations, and
logs.

------------------------------------------------------------------------

## 14. Competition guide details mentioned in conversation --- verify before relying on them

The prior discussion reported these guide requirements:

-   Five broad deliverable areas rather than just an ML model.
-   A `make data` command to rebuild data layers.
-   A Data Quality Agent that uses checks/tools and makes `FIX`, `FILL`,
    or `FLAG` decisions with explanations and logs.
-   A forecasting model that beats a baseline, avoids leakage, reports
    uncertainty, and reports group-level performance.
-   An Insight Agent/RAG system whose numbers come from the
    processed/gold data and whose claims cite trusted evidence.
-   A test of an unsupported question that should produce an "I don't
    know"/unsupported answer rather than a hallucination.
-   Hourly pipeline automation and Prefect run history.
-   A raw-file manifest with source/query, fetch time, SHA-256, and
    licence.
-   Stable row IDs in the processed/gold dataset.
-   Scoring reported as: 40 points automatic checks, 20 data integrity,
    15 agentic design/automation, 10 scientific rigour, 10
    usefulness/responsible AI, and 5 viva/demo.

**These are second-hand details from the previous conversation. Verify
exact wording, points, filenames, commands, cadence, and submission
requirements against the official participant guide.** Do not invent a
requirement or claim compliance without evidence.

The earlier answer cited a participant guide, but this context file does
not contain the full guide itself. If the guide is available in the
project repository or attached files, inspect it directly before making
implementation decisions.

------------------------------------------------------------------------

## 15. Suggested implementation order

Do not try to build every component at once. First inspect the current
repository and identify what already exists.

### Phase 0 --- Repository and requirement audit

-   Inspect files, code, README, dependency/config files, existing
    datasets, and tests.
-   Read the official competition guide.
-   List requirements, evidence needed, and acceptance criteria.
-   Identify what is implemented, partially implemented, and missing.
-   Do not overwrite working code or create duplicate modules before
    understanding the current structure.

### Phase 1 --- Data foundation

-   Verify data sources, licences, fields, temporal resolution, and city
    coverage.
-   Establish raw/cleaned/processed conventions.
-   Implement manifest/checksum logging.
-   Implement deterministic cleaning and validation.
-   Add tests for schema, timezones, units, duplicates, missingness, and
    suspicious values.
-   Ensure stable row IDs and provenance.

### Phase 2 --- Baseline and forecasting

-   Define the forecast target precisely.
-   Build a simple baseline.
-   Establish chronological train/validation/test periods.
-   Build leakage-safe features and a model.
-   Compare metrics against the baseline.
-   Evaluate uncertainty and group performance.
-   Save model/version/metrics and prediction records.

### Phase 3 --- Data Quality Agent

-   Expose validation results as structured tool outputs.
-   Define permitted `FIX` / `FILL` / `FLAG` policies.
-   Make decisions auditable and bounded.
-   Revalidate after permitted changes.
-   Test edge cases and ensure extreme-but-real pollution is not
    automatically discarded.

### Phase 4 --- Insight Agent

-   Create approved-document corpus and metadata.
-   Build retrieval over documents and relevant structured data.
-   Implement data-query tools for forecast, metrics, quality status,
    and lineage.
-   Enforce "numbers from tools, not generated by LLM."
-   Add citations, unsupported-question behavior, and tests against
    hallucination.

### Phase 5 --- Automation

-   Orchestrate the pipeline.
-   Add schedule, retries, logging, run IDs, and freshness checks.
-   Test failure behavior and reruns.
-   Capture real run history as evidence.

### Phase 6 --- Dashboard and demo

-   Display forecast, interval, freshness, quality, metrics, citations,
    and limitations.
-   Make stale or failed runs obvious.
-   Prepare a demo that traces one forecast back to its sources.
-   Prepare examples of a successful run, a quality issue, an uncertain
    prediction, and an unsupported question.

------------------------------------------------------------------------

## 16. Acceptance checklist

Before claiming the project is ready, verify each applicable requirement
against the official guide.

### Data

-   [ ] Source and licence verified.
-   [ ] Raw files preserved unchanged.
-   [ ] Manifest includes required metadata and checksums.
-   [ ] Cleaning transformations documented and tested.
-   [ ] Quality rules cover schema, types, ranges, missingness,
    duplicates, freshness, and relevant drift checks.
-   [ ] Processed dataset has stable row IDs and provenance.
-   [ ] Suspicious high pollution values are not automatically discarded
    without evidence.

### ML

-   [ ] Forecast target, horizon, units, timezone, and location are
    defined.
-   [ ] Baseline is implemented and reported.
-   [ ] Split is chronological and test data remains untouched.
-   [ ] Preprocessing is fitted on training data only.
-   [ ] Features do not leak future information.
-   [ ] Metrics are reported with context.
-   [ ] Uncertainty interval is methodologically justified and
    evaluated.
-   [ ] Performance is inspected across meaningful groups.

### Data Quality Agent

-   [ ] Uses actual validation/tool results.
-   [ ] `FIX` / `FILL` / `FLAG` actions are bounded by policy.
-   [ ] Each decision has a reason and audit record.
-   [ ] Imputed data is explicitly marked.
-   [ ] Unresolved issues are visible.
-   [ ] Revalidation occurs after changes.

### Insight Agent

-   [ ] Uses retrieved documents and structured-data tools.
-   [ ] Forecast values and metrics come from stored results.
-   [ ] Numbers and claims are traceable.
-   [ ] Citations support the associated statements.
-   [ ] Unsupported questions produce an honest limitation response.
-   [ ] Does not make unsupported causal, health, or policy claims.

### Automation and UI

-   [ ] Required command(s) rebuild the data pipeline reproducibly.
-   [ ] Scheduler/orchestrator is configured as required.
-   [ ] Actual run history and failures are visible.
-   [ ] Dashboard shows timestamps, freshness, uncertainty, and quality
    status.
-   [ ] Stale predictions are not presented as fresh.
-   [ ] Human decision-maker remains responsible for consequential
    decisions.

### Delivery

-   [ ] Official guide checked for exact deliverables and scoring.
-   [ ] Setup and reproduction instructions work from a clean
    environment.
-   [ ] Tests and demo are repeatable.
-   [ ] No secrets or credentials are committed.
-   [ ] Claims in the report/demo are supported by recorded evidence.

------------------------------------------------------------------------

## 17. How the coding agent should work with this context

When continuing this project:

1.  **Inspect before changing.** Read the repository and existing files
    before proposing edits.
2.  **Use the official guide as the authority.** If it conflicts with
    this summary, follow the guide and flag the discrepancy.
3.  **Ask only for genuinely missing information.** Do not repeatedly
    ask for details already present in repository files.
4.  **Separate facts from assumptions.** Label examples, placeholders,
    unverified sources, and synthetic results.
5.  **Never fabricate results.** Do not invent data, metrics, citations,
    run history, model performance, or completed tasks.
6.  **Keep the implementation reproducible.** Prefer tested code,
    configuration, deterministic transformations where feasible, and
    documented commands.
7.  **Preserve provenance.** Maintain source metadata, stable row IDs,
    model/run versions, and audit logs.
8.  **Be careful with time-series ML.** Check target alignment, timezone
    handling, and leakage at every step.
9.  **Constrain LLM agents.** Use structured tools, validated outputs,
    approved sources, and explicit refusal/uncertainty behavior.
10. **Explain technical decisions clearly.** The user is comfortable
    with Python/Pandas and core ML concepts but wants plain-language
    explanations of data pipelines, validation, agentic workflows, RAG,
    orchestration, reproducibility, and evidence.
11. **Build incrementally.** Propose the next small, testable step and
    state its input, output, purpose, and how it will be verified.
12. **Do not assume implementation status.** The conversation discussed
    a proposed architecture; it did not establish that any of these
    components have been implemented.

------------------------------------------------------------------------

## 18. Plain-language glossary

  -----------------------------------------------------------------------
  Term                                Meaning in this project
  ----------------------------------- -----------------------------------
  PM2.5                               Fine airborne particles; the
                                      forecast target in this project.

  Data pipeline                       Ordered steps that turn source data
                                      into validated, model-ready data
                                      and outputs.

  Reproducible                        Another person can rerun the
                                      documented process without hidden
                                      manual steps.

  Raw data                            Original retrieved files, preserved
                                      unchanged.

  Cleaned data                        Parsed/normalized data with known
                                      issues handled or flagged.

  Processed/gold data                 Canonical model-ready data with
                                      features, targets, and traceable
                                      row IDs.

  Validation                          Tests that determine whether data
                                      meets declared quality rules.

  Imputation                          Filling missing values using a
                                      stated method; it must be marked
                                      and justified.

  Data lineage                        The traceable history from source
                                      data through transformations to an
                                      output.

  Manifest                            File listing with source and
                                      integrity metadata.

  SHA-256                             A cryptographic hash used to check
                                      whether a file matches its recorded
                                      content fingerprint.

  Baseline                            A simple reference method used to
                                      judge whether the ML model adds
                                      value.

  Leakage                             Using information in
                                      training/features that would not
                                      legitimately be available at
                                      prediction time.

  MAE                                 Mean absolute error, typically
                                      expressed in the target's units.

  RMSE                                Root mean squared error, which
                                      penalizes larger errors more
                                      heavily.

  Prediction interval                 A range intended to communicate
                                      forecast uncertainty, validated
                                      using an appropriate method.

  Agent                               A component that uses
                                      tools/evidence to perform a bounded
                                      task and records or explains its
                                      actions.

  RAG                                 Retrieval-Augmented Generation:
                                      retrieve relevant evidence, then
                                      use an LLM to explain it.

  Hallucination                       A generated claim that is not
                                      supported by the available
                                      evidence.

  Orchestration                       Scheduling and coordinating
                                      pipeline tasks, dependencies,
                                      retries, and run monitoring.

  Prefect                             A possible orchestration tool
                                      mentioned in the conversation;
                                      confirm whether it is required.

  Freshness                           How recently the underlying
                                      data/output was updated relative to
                                      expectations.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Final guiding principle

Build a system where every important forecast or explanation can be
traced back to data, code, evaluation, and evidence. **Trustworthiness
is demonstrated through provenance, tests, honest uncertainty, clear
limitations, and reproducible runs---not through the use of the words
"AI agent" alone.**
