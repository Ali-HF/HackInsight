"""
HackInsight — Pipeline Monitoring (Hugging Face Space)
Operational telemetry, data governance, and execution monitoring dashboard.
"""

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd
import plotly.graph_objects as go
import gradio as gr

# Ensure current directory is on path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

from data_provider import (
    TelemetryDataProvider,
    VERCEL_APP_URL,
    GITHUB_REPO_URL,
    DEFAULT_FRESHNESS_THRESHOLD_HOURS
)

provider = TelemetryDataProvider()

# Modern Technical Theme & CSS Styling
CUSTOM_CSS = """
/* HackInsight Monitoring Theme */
body, .gradio-container {
    background-color: #0b0f19 !important;
    color: #f3f4f6 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
}

.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin: 16px 0;
}

.status-card {
    background: rgba(17, 24, 39, 0.85);
    border: 1px solid rgba(55, 65, 81, 0.7);
    border-radius: 10px;
    padding: 16px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s ease, border-color 0.15s ease;
}

.status-card:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
}

.status-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.card-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.card-status {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.025em;
}

.status-healthy { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }
.status-warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; }
.status-failed  { background: rgba(239, 68, 68, 0.2);  color: #ef4444; border: 1px solid #ef4444; }
.status-stale   { background: rgba(249, 115, 22, 0.2); color: #f97316; border: 1px solid #f97316; }
.status-unknown { background: rgba(107, 114, 128, 0.2);color: #9ca3af; border: 1px solid #6b7280; }

.card-meta {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 6px;
}

.card-desc {
    font-size: 0.82rem;
    color: #e5e7eb;
    line-height: 1.35;
}

.card-ref {
    display: inline-block;
    margin-top: 8px;
    font-size: 0.72rem;
    color: #60a5fa;
    text-decoration: none;
}

.metric-banner {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.5);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
}

.metric-pill {
    flex: 1;
    min-width: 140px;
}

.metric-pill-title {
    font-size: 0.72rem;
    color: #94a3b8;
    text-transform: uppercase;
}

.metric-pill-value {
    font-size: 1.15rem;
    font-weight: 700;
    color: #ffffff;
}
"""


def render_cards_html(cards: list) -> str:
    """Generate HTML snippet for the 5 system status cards."""
    html = '<div class="status-grid">'
    for c in cards:
        st = c.get("status", "UNKNOWN").upper()
        if st == "HEALTHY":
            st_class = "status-healthy"
        elif st in ("WARNING", "WARN"):
            st_class = "status-warning"
        elif st in ("FAILED", "FAIL"):
            st_class = "status-failed"
        elif st == "STALE":
            st_class = "status-stale"
        else:
            st_class = "status-unknown"

        ref = c.get("ref_link", "")
        ref_html = f'<div class="card-ref">Ref: <code>{ref}</code></div>' if ref else ""

        html += f"""
        <div class="status-card">
            <div class="status-card-header">
                <span class="card-title">{c.get('name')}</span>
                <span class="card-status {st_class}">{st}</span>
            </div>
            <div class="card-meta">Last Verified: {c.get('last_verified', 'N/A')}</div>
            <div class="card-desc">{c.get('explanation', '')}</div>
            {ref_html}
        </div>
        """
    html += '</div>'
    return html


def render_freshness_html(freshness: dict) -> str:
    """Render Data Freshness metrics pill bar."""
    is_fresh = freshness.get("is_fresh", False)
    thresh = freshness.get("threshold_hours", DEFAULT_FRESHNESS_THRESHOLD_HOURS)
    status_label = "FRESH (Within Threshold)" if is_fresh else "STALE (Exceeds Threshold)"
    badge_color = "#10b981" if is_fresh else "#f59e0b"

    html = f"""
    <div class="metric-banner">
        <div class="metric-pill">
            <div class="metric-pill-title">Data Ingestion Source</div>
            <div class="metric-pill-value">{freshness.get('source', 'PAQI Ground Sensor')}</div>
        </div>
        <div class="metric-pill">
            <div class="metric-pill-title">Latest Ground Observation</div>
            <div class="metric-pill-value">{freshness.get('latest_observation') or 'Not available'}</div>
        </div>
        <div class="metric-pill">
            <div class="metric-pill-title">Data Age</div>
            <div class="metric-pill-value">{freshness.get('age_display', 'N/A')}</div>
        </div>
        <div class="metric-pill">
            <div class="metric-pill-title">Freshness Threshold</div>
            <div class="metric-pill-value">{thresh}h max</div>
        </div>
        <div class="metric-pill">
            <div class="metric-pill-title">Compliance Status</div>
            <div class="metric-pill-value" style="color: {badge_color};">{status_label}</div>
        </div>
    </div>
    """
    return html


def build_execution_timeline_chart(runs: list) -> go.Figure:
    """Construct Plotly visualization of execution timeline and duration."""
    fig = go.Figure()

    if not runs:
        fig.add_annotation(
            text="No historical pipeline runs available to chart.",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(size=14, color="#9ca3af")
        )
        fig.update_layout(
            template="plotly_dark",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            height=260
        )
        return fig

    # Process runs (reverse chronological -> chronological for timeline)
    runs_chronological = list(reversed(runs[:25]))
    timestamps = [r.get("timestamp_utc") or r.get("run_id") for r in runs_chronological]
    durations = [r.get("duration_seconds", 0.0) for r in runs_chronological]
    statuses = [r.get("status", "UNKNOWN") for r in runs_chronological]
    run_ids = [r.get("run_id", "") for r in runs_chronological]

    colors = ["#10b981" if s == "SUCCESS" else "#ef4444" for s in statuses]

    fig.add_trace(go.Bar(
        x=timestamps,
        y=durations,
        marker=dict(color=colors),
        text=[f"{s}<br>{d:.1f}s" for s, d in zip(statuses, durations)],
        hovertext=[f"Run ID: {rid}<br>Status: {s}<br>Duration: {d:.2f}s" for rid, s, d in zip(run_ids, statuses, durations)],
        hoverinfo="text",
        name="Execution Duration"
    ))

    fig.update_layout(
        title=dict(text="Recent Execution Duration & Status (Green: SUCCESS | Red: FAILED)", font=dict(size=13, color="#d1d5db")),
        xaxis=dict(title="Execution Timestamp (UTC)", showgrid=False, tickfont=dict(color="#9ca3af", size=10)),
        yaxis=dict(title="Duration (seconds)", showgrid=True, gridcolor="rgba(75, 85, 99, 0.3)", tickfont=dict(color="#9ca3af", size=10)),
        template="plotly_dark",
        paper_bgcolor="rgba(17, 24, 39, 0.6)",
        plot_bgcolor="rgba(17, 24, 39, 0.6)",
        margin=dict(l=40, r=20, t=40, b=40),
        height=280
    )
    return fig


def refresh_dashboard():
    """Fetch live telemetry and return refreshed outputs for all dashboard components."""
    telemetry = provider.get_telemetry()
    source_mode = telemetry.get("_data_source_mode", "Unknown")

    now_utc_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    header_info = (
        f"**Source Data Mode:** `{source_mode}` | "
        f"**Last Refreshed:** `{now_utc_str}` | "
        f"[Main Frontend (Vercel)]({VERCEL_APP_URL}) | "
        f"[GitHub Repo]({GITHUB_REPO_URL})"
    )

    # 1. System Cards HTML
    cards = provider.evaluate_system_cards(telemetry)
    cards_html = render_cards_html(cards)

    # 2. Freshness HTML
    freshness = provider.evaluate_data_freshness(telemetry)
    freshness_html = render_freshness_html(freshness)

    # 3. Model & Cities Forecast Summary
    model_details = provider.evaluate_model_details(telemetry)
    lahore_forecast_md = f"""
    ### 🏙️ Lahore (26 Verified Ground Stations)
    - **Current PM2.5:** `{model_details['lahore_pm25']} µg/m³`
    - **24-Hour Horizon Prediction:** `{model_details['lahore_pm25']} µg/m³`
    - **80% Prediction Interval:** `{model_details['lahore_ci']} µg/m³`
    - **Verified Sensor Centroid:** `0166919645da6ef4` (DHA Phase 5)
    """

    karachi_forecast_md = f"""
    ### 🏙️ Karachi (4 Verified Ground Stations)
    - **Current PM2.5:** `{model_details['karachi_pm25']} µg/m³`
    - **24-Hour Horizon Prediction:** `{model_details['karachi_pm25']} µg/m³`
    - **80% Prediction Interval:** `{model_details['karachi_ci']} µg/m³`
    - **Verified Sensor Centroid:** `212607b3f328c11e` (Dawlance Korangi)
    """

    # 4. Data Quality Table
    dq = provider.evaluate_quality_metrics(telemetry)
    dq_summary_md = f"""
    ### 🛡️ Data Quality Agent Certification
    - **Overall Audit Status:** `{dq['overall_status']}`
    - **Total Records Checked:** `{dq['records_checked']}`
    - **Checks Run:** `{dq['checks_run']}`
    - **Target Column Nulls:** `{dq['target_nulls']}` (Zero-tolerance policy)
    - **Duplicate Record IDs:** `{dq['duplicate_records']}`
    - **Schema Completeness:** `{dq['schema_validation']}`
    """

    dq_decisions_df = pd.DataFrame([
        {"Policy Action": "NO_ACTION", "Rule Count": dq['no_action_count'], "Policy Meaning": "Certified clean against validation rules (No modification)"},
        {"Policy Action": "FLAG", "Rule Count": dq['flag_count'], "Policy Meaning": "Preserved scientifically with audit log; no silent imputation"},
        {"Policy Action": "FILL", "Rule Count": dq['fill_count'], "Policy Meaning": "Bounded backward forward-fill for weather covariates (<=2h)"},
        {"Policy Action": "FIX", "Rule Count": dq['fix_count'], "Policy Meaning": "Deterministic deduplication or whitespace cleanup"}
    ])

    # 5. Model Metrics
    model_metrics_df = pd.DataFrame([
        {"Metric": "Model Type", "Value": str(model_details['model_name'])},
        {"Metric": "Model Version", "Value": str(model_details['model_version'])},
        {"Metric": "Forecast Horizon", "Value": f"t+{model_details['horizon_hours']} hours"},
        {"Metric": "Feature Count", "Value": str(model_details['feature_count'])},
        {"Metric": "Test MAE (Mean Absolute Error)", "Value": f"{model_details['test_mae']} µg/m³"},
        {"Metric": "Persistence Baseline MAE", "Value": f"{model_details['base_mae']} µg/m³"},
        {"Metric": "MAE Improvement Over Baseline", "Value": f"{model_details['mae_improvement_pct']}%"},
        {"Metric": "80% Uncertainty Band Coverage", "Value": f"{model_details['coverage_80']}%"}
    ])

    # 6. Execution History Table & Plotly Chart
    history_df = provider.get_execution_history_df(telemetry)
    runs = telemetry.get("run_history") or []
    chart = build_execution_timeline_chart(runs)

    success_runs = sum(1 for r in runs if r.get("status") == "SUCCESS")
    total_runs = len(runs)
    rate = f"{(success_runs / total_runs * 100):.1f}%" if total_runs > 0 else "N/A"
    history_stats_md = f"**Total Runs Recorded:** `{total_runs}` | **Successful:** `{success_runs}` | **Success Rate:** `{rate}`"

    return (
        header_info,
        cards_html,
        freshness_html,
        lahore_forecast_md,
        karachi_forecast_md,
        dq_summary_md,
        dq_decisions_df,
        model_metrics_df,
        history_stats_md,
        chart,
        history_df
    )


# Construct Gradio Interface
with gr.Blocks(title="HackInsight — Pipeline Monitoring") as demo:
    gr.HTML(f"<style>{CUSTOM_CSS}</style>")
    gr.Markdown("# 🌫️ HackInsight — Pipeline Monitoring")
    gr.Markdown(
        "Operational telemetry, data governance, and execution monitoring dashboard for the "
        "Pakistan PM2.5 forecasting and decision-support system."
    )

    with gr.Row():
        header_markdown = gr.Markdown("Loading telemetry status...")
        refresh_btn = gr.Button("🔄 Refresh Telemetry", variant="secondary", size="sm")

    with gr.Tabs():
        # TAB 1: System Overview
        with gr.TabItem("🌐 System Overview & Telemetry"):
            gr.Markdown("### 🚦 Component Operational Health")
            cards_display = gr.HTML("<p>Evaluating components...</p>")

            gr.Markdown("### ⏱️ Data Freshness & Pipeline Ingestion")
            freshness_display = gr.HTML("<p>Loading freshness data...</p>")

            gr.Markdown("### 🎯 Verified 24-Hour Horizon City Predictions")
            with gr.Row():
                lahore_md = gr.Markdown()
                karachi_md = gr.Markdown()

        # TAB 2: Data Quality Agent
        with gr.TabItem("🛡️ Data Quality Governance"):
            gr.Markdown("### 📋 Deterministic Quality Audit & Decision Policy")
            with gr.Row():
                dq_summary_display = gr.Markdown()
            gr.Markdown("#### Anomaly Remediation Policy Matrix")
            dq_table_display = gr.DataFrame(interactive=False)

        # TAB 3: Model Performance
        with gr.TabItem("📈 Forecasting Model & Accuracy"):
            gr.Markdown("### 📊 HistGradientBoostingRegressor Verification")
            model_table_display = gr.DataFrame(interactive=False)
            gr.Markdown("""
            > **Grounding & Transparency Note:** The forecaster strictly evaluates on identical held-out test splits
            > against the declared seasonal persistence baseline. Predictions are only published when verified
            > by the automated orchestration pipeline.
            """)

        # TAB 4: Execution History
        with gr.TabItem("⚙️ Execution History & Reliability"):
            history_kpi_display = gr.Markdown()
            timeline_chart_display = go_plot = gr.Plot()
            gr.Markdown("### 📜 Verified Pipeline Execution Logs")
            history_table_display = gr.DataFrame(interactive=False)

        # TAB 5: Project Info
        with gr.TabItem("ℹ️ Project Architecture & Documentation"):
            gr.Markdown(f"""
            ### 🏛️ Project Architecture: HackInsight
            - **Forecasting Target:** 24-hour calibrated PM2.5 concentrations ($t+24$) for Lahore and Karachi.
            - **Ground Sensors:** 30 verified stations (26 in Lahore, 4 in Karachi) from Pakistan Air Quality Initiative (PAQI) and NASA ASDC DAAC.
            - **Meteorological Covariates:** NASA POWER hourly surface meteorology and Open-Meteo.
            - **Orchestration:** Hourly Prefect flow scheduled at `0 * * * *` (Asia/Karachi).
            - **User Frontend:** TypeScript / React 19 application deployed on Vercel at [{VERCEL_APP_URL}]({VERCEL_APP_URL}).
            - **Code Repository:** [{GITHUB_REPO_URL}]({GITHUB_REPO_URL})

            ### 🧪 Health Criteria Definitions:
            | Status | Definition & Evidence Condition |
            | :--- | :--- |
            | **`HEALTHY`** | Component is active, recent run succeeded, and outputs satisfy all contract thresholds. |
            | **`WARNING`** | Non-critical anomalies or minor quality flags detected; operational delivery preserved. |
            | **`STALE`** | Latest observation or run age exceeds the configured freshness threshold ({DEFAULT_FRESHNESS_THRESHOLD_HOURS}h). |
            | **`FAILED`** | Service threw a fatal runtime exception, missing contract columns, or failed validation. |
            | **`UNKNOWN`** | Telemetry artifacts or backend status are unreachable. |
            """)

    # Event Bindings
    outputs_list = [
        header_markdown,
        cards_display,
        freshness_display,
        lahore_md,
        karachi_md,
        dq_summary_display,
        dq_table_display,
        model_table_display,
        history_kpi_display,
        timeline_chart_display,
        history_table_display
    ]

    demo.load(fn=refresh_dashboard, inputs=[], outputs=outputs_list)
    refresh_btn.click(fn=refresh_dashboard, inputs=[], outputs=outputs_list)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    demo.launch(server_name="0.0.0.0", server_port=port, share=False)
