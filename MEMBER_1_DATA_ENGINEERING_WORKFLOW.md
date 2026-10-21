# Member 1 — Data Engineering & Data Quality Pipeline

**Project:** PM2.5 Air-Quality Forecasting in Pakistan
**Primary responsibilities:** Data acquisition, provenance, cleaning, validation, reproducibility, and processed-data delivery
**AI development environment:** Google Antigravity
**Primary data sources to investigate:** PAQI PM2.5 data and NASA POWER weather data
**Status:** Implementation specification — verify against the official competition guide before coding

---

## 1. Mission and scope

Member 1 owns the data foundation used by the rest of the team.

The objective is to create a reproducible pipeline that turns source datasets into documented, validated, traceable data suitable for air-quality forecasting.

The pipeline must follow this general flow:

```text
Official Competition Requirements
              |
              v
       Source Discovery
              |
              v
         Raw Ingestion
              |
              v
       Data Profiling
              |
              v
       Cleaning Pipeline
              |
              v
      Validation Engine
              |
              v
      Quality Assessment
              |
              v
      Processed / Gold Data
              |
              v
        ML Data Handoff
```

The pipeline must preserve the original source data, document transformations, generate machine-readable validation results, and allow another team member to reproduce its outputs.

### In scope

* Reading the official competition guide
* Discovering and acquiring permitted source data
* PAQI PM2.5 data ingestion
* NASA POWER weather data ingestion
* Data manifests and cryptographic checksums
* Raw-data preservation
* Data profiling and cleaning
* Data-quality validation
* Timestamp and location alignment
* Data provenance and lineage
* Structured quality reports
* Integration interfaces for the Data Quality Agent
* Processed data generation
* Tests, documentation, and reproducibility

### Out of scope unless explicitly assigned

* Developing the final forecasting model
* Designing the full dashboard
* Building the complete autonomous Data Quality Agent
* Inventing missing measurements
* Changing the competition's required interface
* Replacing official competition requirements with personal preferences

Member 1 must provide reliable tools and outputs to the members responsible for those components.

---

## 2. Non-negotiable rules

1. Read the official competition documentation before implementation.
2. Inspect the existing repository before creating or replacing files.
3. Never overwrite or silently modify raw source files.
4. Never fabricate measurements, source metadata, licenses, or validation results.
5. Never assume column names, timezones, units, frequencies, or sentinel values without evidence.
6. Never delete questionable records without documenting the rule and its effect.
7. Never merge datasets solely because their timestamps look similar.
8. Never use future information when constructing historical forecasting features.
9. Never report that a pipeline passed unless the relevant checks actually ran.
10. Never commit credentials, private keys, API tokens, or sensitive local configuration.
11. Follow the official competition's required directory structure, file formats, schemas, and commands whenever specified.
12. When a required decision cannot be resolved from the repository or reliable documentation, ask the team a specific question.

### Safe autonomy policy

Antigravity may independently inspect files, profile datasets, write non-destructive code, and run safe tests.

It must ask for confirmation before:

* Deleting or overwriting existing data
* Changing competition-mandated interfaces
* Introducing an unapproved data source
* Using paid APIs or credentials
* Making irreversible repository changes
* Applying a consequential cleaning decision that lacks an approved rule

When a critical fact is missing, document the blocker rather than inventing an answer.

---

## 3. Repository inspection and requirement mapping

Before writing code, inspect:

* The repository tree
* README and existing documentation
* Competition rules and evaluation instructions
* Existing data files and metadata
* Existing scripts and notebooks
* Requirements files or project configuration
* Git status and uncommitted changes
* Existing tests and CI configuration
* Other team members' interfaces, if available

Create the following documents unless equivalent documents already exist:

```text
docs/
  data_engineering_plan.md
  data_source_register.md
  data_dictionary.md
  data_quality_policy.md
  data_pipeline_runbook.md

reports/
  requirements_traceability.md
  data_inventory.md
  data_quality/
```

Do not duplicate existing documentation unnecessarily. Update the existing authoritative files instead.

### Requirement traceability table

Create a table with these columns:

| Field                | Meaning                                 |
| -------------------- | --------------------------------------- |
| Requirement ID       | Stable identifier such as REQ-DATA-001  |
| Official requirement | Exact requirement or faithful summary   |
| Source               | Document and section/page               |
| Implementation       | File, function, or pipeline stage       |
| Verification         | Test, command, or artifact              |
| Status               | Pending, implemented, verified, blocked |
| Evidence             | Output or report location               |

Every mandatory competition requirement must be traceable to implementation and verification evidence.

---

## 4. Missing-information protocol

Antigravity must distinguish between three types of missing information.

### Type A — Discoverable by inspection

Examples:

* Actual column names
* File formats
* Row counts
* Timestamp ranges
* Available city or sensor fields
* Existing scripts
* Current repository structure

Antigravity should inspect the repository and source documentation to discover these.

### Type B — Discoverable from reliable external documentation

Examples:

* Official API parameters
* Published variable definitions
* Source units
* Data access conditions
* Documented API limitations
* Published licensing terms

Antigravity should verify these against authoritative documentation and record the source and access date.

### Type C — Requires a team decision or missing artifact

Examples:

* The official competition guide is unavailable
* The required forecast horizon is unspecified
* The intended train/test split is unknown
* The team has not supplied its existing PAQI file
* The source license cannot be established
* The required output schema is unclear
* A critical choice between competing cleaning rules cannot be justified

Antigravity must ask a targeted question for these items.

### Question format

For each unresolved issue, report:

```text
Question ID:
What is missing:
Why it matters:
What I inspected:
Options:
Recommended option:
Evidence for the recommendation:
Can implementation safely continue without this answer?
What artifact or answer is required from the team?
```

Ask related questions together in a concise, numbered list.

Do not ask the user to supply facts that can be discovered from the files or reliable source documentation.

Do not repeatedly ask questions already answered in the repository.

If a decision is non-blocking, document a reversible provisional default and continue. Clearly label the default as provisional.

If a decision is critical, pause only the affected implementation stage.

---

## 5. Data source register

The initial source register must include at least the following entries.

### Source A — PAQI PM2.5

Purpose: Obtain the PM2.5 observations used as the forecasting target.

Required investigation:

* Official dataset URL or authorized download location
* Dataset owner and publisher
* Access method
* License and permitted use
* Available cities and monitoring stations
* Measurement units
* Timestamp meaning and timezone
* Sampling frequency
* Available history
* Missing-value conventions
* Station metadata
* Update frequency, if applicable

Do not assume the source has a particular schema until the actual dataset is inspected.

### Source B — NASA POWER

Purpose: Obtain documented weather variables associated with the forecasting locations and period.

Required investigation:

* Official API endpoint or authorized download mechanism
* Supported geographic coordinates
* Requested parameters
* Temporal resolution
* Available history
* Variable definitions and units
* Timestamp convention
* Data availability and latency
* API limits and error behavior
* Licensing or usage requirements

Choose variables only after examining the modelling objective, source availability, and competition requirements.

### Source C — Additional sources

Only add another source if the competition requirements or the modelling plan justify it.

Document the reason, provenance, licensing, and integration impact before adding it.

### Source register fields

Use a structured file such as `docs/data_source_register.md` or a machine-readable equivalent with:

```text
source_id
source_name
publisher
source_url
access_method
retrieval_timestamp_utc
source_period_start
source_period_end
geographic_coverage
license_status
license_reference
variable_definitions
units
timezone_or_time_convention
update_frequency
limitations
notes
```

Use explicit unknown/null values where appropriate. Do not substitute fabricated metadata.

---

## 6. Proposed repository layout

Treat this as a proposal, not a replacement for the official repository specification.

```text
project/
├── data/
│   ├── raw/
│   │   ├── paqi/
│   │   └── nasa_power/
│   ├── interim/
│   ├── processed/
│   └── manifests/
│
├── src/
│   └── data_pipeline/
│       ├── ingestion/
│       ├── profiling/
│       ├── cleaning/
│       ├── validation/
│       ├── alignment/
│       ├── processing/
│       ├── provenance/
│       └── cli.py
│
├── configs/
│   ├── data_sources.yaml
│   └── data_quality.yaml
│
├── schemas/
│   ├── manifest.schema.json
│   └── validation_report.schema.json
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── fixtures/
│   └── contract/
│
├── reports/
│   └── data_quality/
│
├── docs/
│   ├── data_engineering_plan.md
│   ├── data_source_register.md
│   ├── data_dictionary.md
│   ├── data_quality_policy.md
│   └── data_pipeline_runbook.md
│
├── README.md
└── project configuration files
```

Keep large raw datasets out of Git unless the competition explicitly requires them to be committed and repository size/licensing rules permit it.

Use an approved artifact-storage or download workflow where appropriate.

---

## 7. Phase 1 — Ingestion and raw-data preservation

### Objectives

* Acquire source data through documented, permitted methods.
* Store the exact downloaded artifact without modifying its contents.
* Record the retrieval operation.
* Make repeat ingestion safe.
* Detect accidental changes to existing artifacts.

### Implementation requirements

Each ingestion operation should record:

* Source ID
* Source URL or API request description
* Retrieval timestamp in UTC
* Original filename
* Stored relative path
* SHA-256 checksum
* Byte size
* File format
* Source period, if known
* Retrieval status
* Error details, if applicable

For API-based ingestion, also record relevant non-secret query parameters, requested variables, coordinates, and date ranges.

Never store access tokens or secrets in manifests.

Do not assume every source provides a downloadable file or a reliable Last-Modified header.

### Idempotency

Repeated ingestion should not silently replace existing data.

Use a content hash to identify identical artifacts. If an artifact differs, preserve both versions or follow the approved versioning policy.

The pipeline should distinguish:

* A new artifact
* An identical artifact
* A changed artifact
* A failed retrieval
* A source that returned no data

### Acceptance criteria

* [ ] Original source bytes are preserved.
* [ ] A manifest entry exists for each successfully ingested artifact.
* [ ] Hashes can be independently recomputed.
* [ ] Failed downloads are reported accurately.
* [ ] Re-running ingestion does not silently destroy prior data.
* [ ] No credentials are included in tracked files.

---

## 8. Phase 2 — Data profiling

Build a profiling command that inspects the actual source datasets before cleaning.

### General profiling

* Row and column counts
* Column names
* Data types
* Null counts and percentages
* Duplicate rows
* Unique values for categorical columns
* File encoding and delimiter where relevant
* Numeric ranges and distributions
* Unexpected or mixed types

### Time-series profiling

* Minimum and maximum timestamps
* Parsed timestamp success rate
* Timezone awareness
* Duplicate timestamps
* Sampling frequency distribution
* Missing intervals
* Long gaps
* Records outside the expected period
* Data availability by day, month, sensor, and city

### PM2.5 profiling

* Observed value range
* Units
* Missing values
* Documented sentinel values
* Negative values
* Extreme observations
* Repeated values and possible sensor flatlines
* Coverage by monitoring station
* Differences in reporting frequency

Do not assume that an extreme PM2.5 reading is automatically erroneous. High pollution events can be real.

### Weather profiling

For each actual weather variable:

* Meaning and source definition
* Unit
* Missingness
* Numeric range
* Timestamp convention
* Geographic reference
* Data frequency
* Coverage and gaps

### Output artifacts

Produce a machine-readable profile report and a human-readable summary.

Include row counts, coverage statistics, missingness, duplicate counts, detected anomalies, and profiling limitations.

Do not print entire sensitive or very large datasets to the console.

---

## 9. Phase 3 — Cleaning policy

Before implementing consequential cleaning decisions, write `docs/data_quality_policy.md`.

For every rule, document:

* Rule ID
* Column(s) affected
* Detection condition
* Action
* Rationale
* Source of the threshold or assumption
* Number of affected records
* Whether the action is reversible
* Whether team approval is needed

### Timestamp cleaning

* Parse timestamps using an explicit, tested strategy.
* Preserve the original timestamp representation where practical.
* Record parse failures.
* Identify whether the source represents UTC, local time, or another convention.
* Convert to a consistent canonical representation only when justified.
* Never infer a timezone silently.
* Avoid treating a timezone-naive timestamp as UTC without evidence.

### Duplicate handling

Distinguish between:

* Exact duplicate rows
* Duplicate observations with identical keys
* Multiple measurements at the same timestamp
* Distinct sensors reporting at the same time

Do not automatically delete all rows sharing a timestamp.

Define the observation key from the actual source schema.

### Missing values

* Detect native nulls and empty strings.
* Identify documented sentinel values.
* Preserve the original value or sufficient lineage to recover it.
* Record the replacement/missingness reason.
* Do not replace all missing values with zero.
* Do not fill missing target PM2.5 observations by default.
* Do not interpolate across long outages without an explicit, approved reason.

### Range and anomaly handling

Use source documentation, physical meaning, and domain evidence to define validity checks.

Separate:

* Impossible values
* Suspicious but plausible values
* Extreme but potentially valid events
* Sensor malfunctions
* Uncertain observations

A statistical outlier detector should flag candidates, not automatically delete genuine pollution spikes.

### Cleaning outputs

Maintain separate raw and cleaned layers.

Record counts before and after each transformation and explain all excluded, corrected, or flagged records.

Where possible, use stable record identifiers or lineage keys to trace cleaned rows back to their raw source.

---

## 10. Phase 4 — Weather and PM2.5 alignment

Combining PM2.5 and weather data requires explicit temporal and geographic rules.

### Geographic alignment

* Inspect the coordinates and station metadata actually available.
* Verify the coordinates used for NASA POWER requests.
* Document whether weather values represent a point, grid cell, or area.
* Do not imply that a gridded weather value is a direct sensor measurement.
* If city-level coordinates are used as proxies, document the limitation.

### Temporal alignment

* Establish the canonical timestamp convention.
* Identify the native resolution of each source.
* Decide whether exact matching, resampling, aggregation, or another strategy is justified.
* Document the selected strategy.
* Report the number of unmatched records and the coverage before and after alignment.

Do not silently convert hourly observations into daily observations, or vice versa.

### Leakage prevention

For a forecast issued at time `t` for horizon `h`, use only features that would genuinely be available at the prediction time.

Historical observed weather after `t` must not be used as if it were known at `t`.

Distinguish between:

1. Historical observed weather
2. Weather observations available at prediction time
3. Archived weather forecasts, if available
4. Future weather observations used only for retrospective analysis

Do not use future observed weather as a forecasting feature unless the evaluation design explicitly permits it.

### Dataset split

The forecasting owner must define the forecast horizon and evaluation protocol.

Use chronological splits for time-series forecasting unless the official evaluation requires another method.

Fit data-dependent transformations on training data only. Avoid leakage through scaling, imputation, feature selection, and other learned preprocessing.

---

## 11. Phase 5 — Validation engine

Create reusable validation functions.

### Structural checks

* Required columns exist.
* Unexpected columns are reported.
* Column types are appropriate.
* Schema version is recorded.

### Data-quality checks

* Missingness
* Duplicate records
* Invalid numeric values
* Domain-specific range violations
* Invalid timestamps
* Time gaps
* Data freshness, where applicable
* Sensor flatlines
* Unexpected category values
* Distribution drift, where enough evidence exists

### Provenance checks

* Raw artifact exists.
* Manifest entry exists.
* Hash is correct.
* Transformation version is recorded.
* Source lineage is available to the extent supported by the source.
* Output can be associated with the input artifacts used to generate it.

### Quality decision categories

Use these categories for findings:

* `PASS`: the check ran and met its configured criterion.
* `WARN`: the check ran and found a concern that does not automatically block processing.
* `FAIL`: the check ran and violated an approved blocking criterion.
* `ERROR`: the check could not execute reliably.
* `NOT_RUN`: the check was intentionally not executed or could not be reached.

Never represent a failed or unexecuted check as a pass.

Thresholds must be defined in configuration or a documented policy, not scattered through code.

Do not invent universal acceptable missingness or freshness thresholds.

---

## 12. Phase 6 — Machine-readable validation reports

Create a versioned report schema.

Example:

```json
{
  "schema_version": "1.0",
  "run_id": "generated-run-identifier",
  "dataset_id": "pm25-cleaned",
  "status": "WARN",
  "checks": [
    {
      "check_id": "timestamp_parse",
      "status": "PASS",
      "severity": "error",
      "records_checked": 1000,
      "records_affected": 0,
      "message": "All timestamps parsed successfully",
      "rule_id": "DQ-TIME-001"
    },
    {
      "check_id": "missing_pm25",
      "status": "WARN",
      "severity": "warning",
      "records_checked": 1000,
      "records_affected": 12,
      "message": "Some target observations are missing",
      "rule_id": "DQ-MISSING-001"
    }
  ]
}
```

The counts and messages above are illustrative examples only, not actual findings from the project's datasets.

The final schema must be validated against its JSON Schema or equivalent.

Include relevant information such as:

* Run ID
* Dataset ID
* Schema version
* Pipeline version or Git commit
* Run start and end time
* Input artifact hashes
* Check IDs
* Check status
* Severity
* Counts
* Evidence references
* Applied actions
* Errors and warnings

Avoid including full source rows or unnecessary sensitive data in reports.

---

## 13. Phase 7 — Data Quality Agent interface

Member 1 provides the deterministic tools. The AI-agent member owns the agent's reasoning and orchestration.

Recommended interface:

```python
profile_dataset(dataset_path, config)
validate_schema(dataset_path, schema_path)
validate_missingness(dataset_path, config)
validate_duplicates(dataset_path, config)
validate_ranges(dataset_path, config)
validate_timestamps(dataset_path, config)
validate_freshness(dataset_path, config)
detect_flatlines(dataset_path, config)
detect_distribution_shift(reference_path, current_path, config)
generate_quality_report(run_results, output_path)
```

Adapt these signatures to the repository's actual conventions.

Each tool must return structured data, not just a printed message.

Each tool should:

* Validate its inputs.
* Use explicit configuration.
* Report the number of records checked and affected.
* Identify the rule responsible for a finding.
* Avoid silently modifying source data.
* Distinguish failed checks from execution errors.
* Be testable without an external LLM.

### Agent action model

The agent may propose:

* `FIX`: apply a documented, deterministic correction.
* `FILL`: apply an approved missing-value strategy where appropriate.
* `FLAG`: retain the record but mark the issue.

The agent must not make arbitrary changes based solely on a natural-language guess.

All changes must pass through validated functions with an auditable record of the proposed action, applied action, rationale, affected rows, and result.

Do not automatically fill missing PM2.5 targets simply to increase dataset completeness.

---

## 14. Phase 8 — Processed / GOLD dataset

Create the authoritative processed dataset used by the ML member.

The exact schema must be derived from:

1. Competition requirements
2. Actual PAQI schema
3. Actual NASA POWER schema
4. Forecasting requirements agreed with the ML member

Potential fields, only where supported and required:

```text
record_id
timestamp_utc
city
sensor_id
latitude
longitude
pm25
weather_features...
```

These are proposed field names, not claims about the existing datasets.

### Requirements

* Define the final schema.
* Document every column and unit.
* Define the canonical timestamp convention.
* Specify missing-value behavior.
* Define observation keys and duplicate handling.
* Record input artifact hashes.
* Record cleaning and transformation versions.
* Provide row counts at each processing stage.
* Preserve source lineage where possible.
* Validate the final schema before publication.
* Make output generation deterministic for identical inputs and configuration.

Avoid embedding training-only transformations into a shared gold dataset unless the team has agreed on that design.

Store fitted preprocessing parameters with the model pipeline and fit them only on the training split.

### Stable IDs

A stable ID should identify the intended observation consistently.

Do not use a transient row number as the sole stable identifier when row order may change.

Use source-provided identifiers when available and reliable. Otherwise, design a documented composite or derived identifier from suitable source keys.

If the source has no stable record identity, document the limitations and do not claim perfect source-row traceability.

---

## 15. Phase 9 — Reproducibility and CLI

Provide a documented command-line interface.

Example commands:

```bash
python -m src.data_pipeline.cli inspect
python -m src.data_pipeline.cli ingest
python -m src.data_pipeline.cli profile
python -m src.data_pipeline.cli clean
python -m src.data_pipeline.cli validate
python -m src.data_pipeline.cli build-gold
python -m src.data_pipeline.cli all
```

These commands are examples. Follow the existing project structure and competition requirements.

Provide a single documented command to reproduce the pipeline from locally available or permitted source inputs.

If internet access, credentials, or an unavailable external source prevents a fully offline run, document the limitation and provide an appropriate staged workflow.

### Reproducibility requirements

* Pin or constrain dependencies appropriately.
* Record configuration and relevant software versions.
* Use deterministic processing where possible.
* Avoid dependence on current working directory.
* Use explicit input and output paths.
* Provide clear errors and nonzero exit codes for failures.
* Never silently reuse stale output after a failed upstream stage.
* Do not mark the run successful when required stages did not execute.
* Support a test mode that does not require production downloads.

A Makefile may be used if the repository supports it.

---

## 16. Phase 10 — Testing strategy

Create tests at several levels.

### Unit tests

Test:

* Timestamp parsing
* Missing-value detection
* Sentinel-value handling
* Duplicate detection
* Range checks
* Stable ID generation
* Manifest generation
* Hash calculation
* Validation report generation

### Integration tests

Test:

* Ingestion using a local fixture
* Cleaning followed by validation
* PM2.5 and weather alignment
* Gold dataset generation
* Manifest-to-artifact consistency
* Error handling for malformed source files

### Contract tests

Test that:

* The final gold schema matches the documented contract.
* Validation outputs match the report schema.
* The Data Quality Agent can call the deterministic tools.
* ML-facing outputs contain documented fields and types.
* Missing upstream data causes a clear error rather than fabricated data.

### Edge cases

Include fixtures for:

* Empty files
* Malformed files
* Missing columns
* Duplicate timestamps
* Missing values
* Invalid timestamps
* Extreme but valid measurements
* Sentinel values
* Long time gaps
* Timezone-naive timestamps
* Failed downloads
* Changed source files
* Missing manifests
* Empty validation inputs

Tests must use synthetic or appropriately licensed fixture data. Do not fabricate synthetic records and present them as real project observations.

---

## 17. Phase 11 — Documentation and evidence

Update the project README or runbook with:

* Prerequisites
* Environment setup
* Data-source access instructions
* Download and ingestion steps
* Expected input files
* Pipeline commands
* Output locations
* Data-quality report locations
* Schema definitions
* Known limitations
* Troubleshooting
* Reproduction instructions

Create a final run report containing:

* Input artifacts and hashes
* Pipeline version
* Run timestamp
* Row counts by stage
* Cleaning actions
* Validation results
* Warnings and failures
* Gold dataset location
* Test results
* Unresolved issues

Do not include a claim of success unsupported by actual execution evidence.

---

## 18. Final handoff contracts

### Handoff to Member 2 — ML

Provide:

* Gold dataset
* Data dictionary
* Input provenance
* Timestamp and timezone conventions
* Feature units
* Missing-value conventions
* Known data-quality limitations
* Forecasting leakage warnings
* Recommended chronological split considerations
* Reproduction command

The ML member must explicitly agree on the target, forecast horizon, and split protocol.

### Handoff to Member 3 — Data Quality Agent

Provide:

* Deterministic validation functions
* Configuration format
* Validation report schema
* Quality rule identifiers
* Action audit format
* Example reports produced by actual tests
* Interface documentation

### Handoff to Member 4 — Integration / dashboard

Provide:

* Stable output location or documented accessor
* Gold schema
* Pipeline run status
* Quality report location
* Data freshness definition, where available
* Error and failure states
* Reproduction instructions

Adapt member numbering to the actual team structure.

---

## 19. Definition of done

Member 1 is complete when:

* [ ] Official competition requirements have been mapped to implementation evidence.
* [ ] PAQI and NASA POWER source availability and access conditions have been verified.
* [ ] Actual source schemas have been inspected.
* [ ] Raw artifacts are preserved.
* [ ] A manifest and hashes are generated.
* [ ] Profiling is reproducible.
* [ ] Cleaning rules are documented.
* [ ] Validation rules are configurable and tested.
* [ ] Validation results are machine-readable.
* [ ] Temporal and geographic alignment is documented.
* [ ] Forecasting leakage risks are addressed.
* [ ] Gold data follows an agreed schema.
* [ ] Data lineage is preserved to the extent supported by source data.
* [ ] ML and agent contracts are documented.
* [ ] Tests run successfully.
* [ ] A reproducible command is documented.
* [ ] Actual outputs and unresolved limitations are reported honestly.
* [ ] No critical unresolved requirement is concealed by an assumption.

---

# 20. Antigravity execution prompts

Run the prompts below sequentially. Do not ask Antigravity to implement every phase in one unreviewed operation.

## Prompt 1 — Repository audit and questions

```text
You are the Data Engineering Lead for a PM2.5 air-quality forecasting
project focused on Pakistan, with PAQI PM2.5 data and NASA POWER
weather data as intended sources.

Read MEMBER_1_DATA_ENGINEERING_WORKFLOW.md completely.

Before writing or modifying implementation code:

1. Inspect the repository tree, Git status, README, project configuration,
   existing tests, data files, notebooks, and documentation.
2. Find the official competition guide and evaluation requirements if
   they are available in the repository.
3. Search the repository for existing schemas, pipeline commands,
   datasets, API integrations, and interfaces owned by other members.
4. Inspect dataset metadata and small samples safely without printing
   entire large datasets.
5. Distinguish verified facts from assumptions and unknowns.
6. Build a requirement-to-implementation-to-test traceability matrix.
7. Create a data inventory and a source register.
8. Identify all missing files, schemas, credentials, source details,
   and decisions required for implementation.
9. Verify discoverable facts from authoritative documentation where
   source access is available.

Create or update the planning documents described in the workflow.
Do not overwrite existing files unnecessarily.

IMPORTANT:
- Do not fabricate a dataset, source URL, license, column, measurement,
  competition rule, or successful test.
- Do not modify raw data.
- Do not introduce a new external source without justification.
- Do not assume forecast horizon, timezone, units, or data frequency.
- Ask me a consolidated numbered list of questions for critical
  information you cannot discover yourself.
- For each question, explain why the answer matters and give a
  recommended option when evidence supports one.
- Continue safe, non-destructive discovery work even if some questions
  remain unanswered.
- Mark unresolved decisions as BLOCKED or PROVISIONAL.
- Do not start consequential implementation until the audit and
  critical-question report are ready.

At the end, report:
A. What you inspected
B. Verified facts
C. Missing information
D. Questions requiring my response
E. Proposed architecture
F. Requirements traceability file
G. Next safe implementation step
```

## Prompt 2 — Source acquisition and manifest

Run after resolving critical source and competition questions.

```text
Implement the source-ingestion stage according to
MEMBER_1_DATA_ENGINEERING_WORKFLOW.md and the verified project requirements.

First inspect existing ingestion code and reuse it where appropriate.

Implement:
1. PAQI data ingestion using the verified source and permitted access method.
2. NASA POWER ingestion using verified parameters and variable definitions.
3. Raw-data preservation.
4. SHA-256 hashing.
5. A versioned data manifest.
6. Safe error handling and structured ingestion logs.
7. Repeatable ingestion without silent overwriting.
8. Configuration-driven source parameters.
9. Tests using local fixtures that do not require network access.

Requirements:
- Do not invent a source URL or download endpoint.
- Do not assume the source has a particular schema.
- Do not fabricate missing data if retrieval fails.
- Do not put secrets in code or manifests.
- Record retrieval time in UTC and the actual request details that
  can safely be recorded.
- Keep exact downloaded file bytes intact.
- If a source is unavailable, document the blocker and implement
  only the verified, testable portions.
- Never report an ingestion as successful unless the artifact was
  actually retrieved and verified.

Run the relevant tests.

Report modified files, actual test results, source limitations,
and remaining questions.
```

## Prompt 3 — Data profiling

```text
Implement a reproducible data-profiling stage for the actual source files.

Inspect real schemas first.

Generate machine-readable and human-readable reports covering:
- Dimensions, column names, and data types
- Missingness
- Duplicate rows and candidate duplicate observation keys
- Timestamp parsing and coverage
- Timezone conventions where established
- Sampling frequency and gaps
- PM2.5 ranges and suspicious observations
- Documented sentinel values
- Geographic and station coverage
- Weather-variable units and coverage
- Potential flatlines and distribution anomalies

Do not label a suspicious measurement as invalid without evidence.
Do not automatically delete or repair any record during profiling.

Record:
- Source artifact hashes
- Profiling software/version
- Run timestamp
- Number of records examined
- Checks that could not be performed and why

Use bounded samples for display and do not print entire datasets.

Add tests and update the data inventory, source register, and data
dictionary with verified findings.

At the end, list the evidence-based cleaning decisions that can be
implemented safely and the decisions requiring team approval.
```

## Prompt 4 — Cleaning pipeline

```text
Implement the cleaning pipeline using the actual schemas, profiling
results, approved quality policy, and competition requirements.

Requirements:
1. Preserve raw files unchanged.
2. Implement cleaning as reusable, testable functions.
3. Preserve sufficient lineage to trace processed records to sources.
4. Make all consequential rules explicit and configurable.
5. Record row counts before and after transformations.
6. Report dropped, corrected, and flagged records separately.
7. Handle timestamps, duplicates, missingness, sentinel values,
   and suspicious ranges according to documented evidence.
8. Do not assume all extreme PM2.5 observations are erroneous.
9. Do not fill missing PM2.5 targets by default.
10. Do not silently infer timezone or measurement units.
11. Make processing deterministic for identical inputs and configuration.
12. Add unit and integration tests.

If a required rule lacks evidence, ask me before implementing it.
A reversible provisional rule may be used only if it is explicitly
marked as provisional, has no unsafe downstream effect, and is
permitted by the competition requirements.

Do not proceed with any destructive transformation.

Run tests and report actual outcomes, row counts, and remaining issues.
```

## Prompt 5 — Validation engine

```text
Implement the deterministic data-validation engine.

Provide reusable checks for:
- Schema
- Types
- Missingness
- Duplicates
- Numeric ranges
- Timestamp parsing
- Time continuity and gaps
- Data freshness where applicable
- Flatlines
- Distribution drift where sufficient evidence exists
- Manifest and checksum consistency
- Gold-dataset contract compliance

Load thresholds and blocking rules from validated configuration.
Do not hard-code unexplained thresholds.

Use statuses:
PASS, WARN, FAIL, ERROR, NOT_RUN.

Distinguish a check failure from an execution error.
Do not allow skipped checks to appear as passed checks.
Generate versioned machine-readable reports and validate their schema.

Add tests for normal, malformed, empty, and edge-case inputs.

Ensure that validation is deterministic and does not mutate raw data.

At the end, demonstrate actual test results and provide example
report output generated by the tests.
```

## Prompt 6 — PM2.5/weather alignment and Gold dataset

```text
Implement the PM2.5/weather alignment and processed Gold dataset
generation stage.

First confirm the approved:
- Forecast target
- Forecast horizon
- Temporal resolution
- Timestamp convention
- Geographic alignment method
- Weather-variable definitions and units
- Final schema
- Chronological evaluation protocol

If a critical item is missing, ask me before committing to an
irreversible or competition-sensitive design.

Requirements:
1. Align data using explicit temporal and geographic rules.
2. Report source coverage and unmatched observations.
3. Document all resampling, aggregation, and join decisions.
4. Preserve provenance and stable observation identifiers where possible.
5. Do not imply that gridded weather values are direct sensor measurements.
6. Prevent future-information leakage in forecasting features.
7. Keep training-only fitted transformations out of shared preprocessing.
8. Validate the final schema.
9. Generate a reproducible Gold dataset.
10. Produce a report describing row counts, missingness, alignment,
    transformations, and limitations.

Never fabricate values to complete the join.
Do not publish a dataset with an unresolved critical schema mismatch.

Run all relevant tests and report the exact output locations.
```

## Prompt 7 — Data Quality Agent contract

```text
Prepare the data-engineering interface for the separate Data Quality Agent.

Do not replace the agent's own implementation. Build the deterministic
tools and interfaces that it can safely call.

Provide documented functions for profiling, schema checks, missingness,
duplicates, ranges, timestamps, freshness, flatlines, distribution
drift, and quality-report generation where applicable.

Each function must:
- Validate inputs.
- Use explicit configuration.
- Return a stable machine-readable structure.
- Include rule IDs, status, counts, and evidence references.
- Distinguish FAIL from ERROR.
- Avoid silently modifying source data.
- Record proposed and applied actions when applicable.

Support the action categories FIX, FILL, and FLAG, but require
documented deterministic rules for changes.

Do not allow an LLM to execute arbitrary data transformations based
solely on free-text instructions.

Create:
- Interface documentation
- Report schema
- Example test-generated reports
- Contract tests
- A clear description of how the agent calls the tools

Check compatibility with the actual agent member's interface if
it exists. If it does not exist, propose an interface and ask the
team to confirm it before treating the contract as final.
```

## Prompt 8 — Reproducibility, testing, and final audit

```text
Complete the data pipeline reproducibility and final audit.

Inspect the entire implementation against
MEMBER_1_DATA_ENGINEERING_WORKFLOW.md and the official competition guide.

Tasks:
1. Run unit, integration, and contract tests.
2. Check the raw-data preservation and manifest hashes.
3. Check schema consistency across pipeline stages.
4. Verify that missing inputs and failed downloads produce clear errors.
5. Verify that failed upstream stages cannot silently publish stale Gold data.
6. Verify that forecasting leakage safeguards are documented and tested.
7. Verify that configuration and dependencies are documented.
8. Implement or update the documented one-command workflow.
9. Confirm that local fixture tests can run without external API access.
10. Update the README, runbook, data dictionary, source register,
    quality policy, and requirement traceability matrix.
11. Identify unimplemented requirements and unsupported assumptions.
12. Generate a final run report using actual results.

Do not modify unrelated team-owned modules without agreement.
Do not claim a test passed unless it actually ran successfully.
Do not hide warnings or unresolved blockers.

Return:
A. Files created or changed
B. Commands executed
C. Actual test results
D. Final Gold schema and output location
E. Provenance and manifest status
F. Quality report location
G. Requirement compliance table
H. Known limitations
I. Remaining blockers
J. Exact instructions for ML, agent, and integration handoff

If any critical requirement remains unverified, label the work
BLOCKED or PARTIALLY COMPLETE rather than claiming full completion.
```

---

## 21. Final instruction to Antigravity

The workflow is a specification, not permission to invent missing project details.

When implementation decisions depend on unavailable information:

1. Inspect the repository and authoritative documentation first.
2. Record what is known and what is missing.
3. Ask specific questions for information only the team can supply.
4. Continue work that is safe and independent of the missing information.
5. Resume blocked work after the required answers or artifacts are supplied.
6. Verify implementation with actual tests and report the evidence.

The objective is a trustworthy, reproducible, competition-compliant data pipeline that every other team member can use and explain.
