"""
Command-Line Interface (CLI) and Orchestrator for PM2.5 Forecasting Pipeline.
HackInsight 2026 - Member 2: Machine Learning.

Usage:
    python -m src.ml_pipeline.cli run
"""

import sys
import argparse
import json
import time
from typing import Dict, Any, List, Optional
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from src.ml_pipeline.features import build_ml_feature_set
from src.ml_pipeline.splitting import chronological_split
from src.ml_pipeline.model import PM25Forecaster
from src.ml_pipeline.evaluation import comprehensive_error_analysis, error_analysis_to_dataframe


def plot_ml_visualizations(
    test_eval_df: pd.DataFrame,
    error_analysis_df: pd.DataFrame,
    figures_dir: Path
):
    """Generate presentation and viva-ready figures for dashboard and reporting."""
    figures_dir.mkdir(parents=True, exist_ok=True)

    # 1. Actual vs Predicted scatter plot (subsampled for clarity)
    sample_df = test_eval_df.sample(min(3000, len(test_eval_df)), random_state=42)
    fig, ax = plt.subplots(figsize=(8, 8))
    ax.scatter(sample_df["actual"], sample_df["predicted"], alpha=0.3, s=15, color="#1f77b4", label="Forecast (t+24h)")
    max_val = min(500, max(sample_df["actual"].quantile(0.99), sample_df["predicted"].quantile(0.99)))
    ax.plot([0, max_val], [0, max_val], "r--", linewidth=1.5, label="Perfect Forecast (1:1)")
    ax.set_xlim(0, max_val)
    ax.set_ylim(0, max_val)
    ax.set_xlabel("Actual Ground PM2.5 at t+24h (µg/m³)", fontsize=11)
    ax.set_ylabel("Predicted PM2.5 at t+24h (µg/m³)", fontsize=11)
    ax.set_title("HackInsight 2026: 24h-Ahead PM2.5 Forecast vs. Actuals (Test Set)", fontsize=12, pad=12)
    ax.grid(True, linestyle="--", alpha=0.5)
    ax.legend(frameon=True)
    fig.tight_layout()
    fig.savefig(figures_dir / "actual_vs_predicted.png", dpi=150)
    plt.close(fig)

    # 2. Time-series snippet with 80% prediction interval
    # Select a continuous 14-day snippet from a primary sensor
    primary_sensor = test_eval_df["sensor_id"].value_counts().index[0]
    ts_snippet = test_eval_df[test_eval_df["sensor_id"] == primary_sensor].sort_values("timestamp_utc").head(168)  # 7 days

    if len(ts_snippet) > 24:
        fig, ax = plt.subplots(figsize=(12, 5))
        ax.plot(ts_snippet["timestamp_utc"], ts_snippet["actual"], "k-", linewidth=1.8, label="Actual Ground Observation")
        ax.plot(ts_snippet["timestamp_utc"], ts_snippet["predicted"], "b--", linewidth=1.5, label="Model Forecast (Point)")
        ax.plot(ts_snippet["timestamp_utc"], ts_snippet["baseline"], color="gray", linestyle=":", alpha=0.8, label="Persistence Baseline")
        ax.fill_between(
            ts_snippet["timestamp_utc"],
            ts_snippet["lower_80"],
            ts_snippet["upper_80"],
            color="blue",
            alpha=0.2,
            label="80% Prediction Interval"
        )
        ax.set_xlabel("Timestamp (UTC)", fontsize=11)
        ax.set_ylabel("PM2.5 (µg/m³)", fontsize=11)
        ax.set_title(f"24h-Ahead Forecast & 80% Uncertainty Band: Sensor {primary_sensor[:8]}", fontsize=12, pad=12)
        ax.grid(True, linestyle="--", alpha=0.5)
        ax.legend(frameon=True, loc="upper right")
        fig.tight_layout()
        fig.savefig(figures_dir / "prediction_interval_sample.png", dpi=150)
        plt.close(fig)

    # 3. Model vs Baseline MAE by Group
    group_df = error_analysis_df[error_analysis_df["category"].isin(["by_city", "by_season", "by_sensor_visibility"])].copy()
    if not group_df.empty:
        fig, ax = plt.subplots(figsize=(10, 5))
        x = np.arange(len(group_df))
        width = 0.35
        ax.bar(x - width/2, group_df["base_mae"], width, label="Persistence Baseline", color="#d62728", alpha=0.8)
        ax.bar(x + width/2, group_df["model_mae"], width, label="LightGBM / HistGB Forecaster", color="#2ca02c", alpha=0.8)
        ax.set_xticks(x)
        ax.set_xticklabels(group_df["slice"], rotation=25, ha="right", fontsize=10)
        ax.set_ylabel("Mean Absolute Error (µg/m³)", fontsize=11)
        ax.set_title("Forecast Error Comparison by Cohort: Model vs. Baseline", fontsize=12, pad=12)
        ax.grid(True, linestyle="--", alpha=0.4, axis="y")
        ax.legend(frameon=True)
        fig.tight_layout()
        fig.savefig(figures_dir / "error_by_group.png", dpi=150)
        plt.close(fig)


def run_pipeline(
    data_path: Path,
    output_dir: Path,
    transform_target: str = "log1p"
) -> Dict[str, Any]:
    """Execute the complete reproducible ML pipeline."""
    t_start = time.time()
    print("=" * 80)
    print("HACKINSIGHT 2026: MEMBER 2 ML FORECASTING PIPELINE EXECUTION")
    print("=" * 80)

    # 1. Directory setup
    models_dir = output_dir / "models"
    metadata_dir = output_dir / "metadata"
    reports_dir = output_dir / "reports"
    predictions_dir = output_dir / "predictions"
    figures_dir = output_dir / "figures"

    for d in [models_dir, metadata_dir, reports_dir, predictions_dir, figures_dir]:
        d.mkdir(parents=True, exist_ok=True)

    # 2. Load Gold Dataset Read-Only
    print(f"\n[Step 1/7] Loading Gold Dataset read-only from {data_path}...")
    if not data_path.is_file():
        raise FileNotFoundError(f"Gold Parquet file not found at {data_path}")

    gold_df = pd.read_parquet(data_path)
    print(f"  Loaded {len(gold_df):,} rows with {len(gold_df.columns)} columns.")

    # 3. Feature Engineering
    print("\n[Step 2/7] Constructing Causal Sensor Lags and Temporal Features...")
    feat_df, feature_names, feat_audit = build_ml_feature_set(gold_df, drop_lag1_nulls=True)
    print(f"  Initial Gold rows: {feat_audit['initial_gold_rows']:,}")
    print(f"  Modeling dataset rows: {feat_audit['modeling_rows']:,} (Removed {feat_audit['rows_removed']:,})")
    print(f"  Constructed {len(feature_names)} safe features (strictly no weather, no sensor_id memorization).")

    # 4. Chronological Splitting
    print("\n[Step 3/7] Performing Strict Chronological Splitting with 24h Buffer Gaps...")
    train_df, val_df, test_df, split_meta = chronological_split(
        feat_df,
        train_ratio=0.70,
        val_ratio=0.15,
        buffer_hours=24
    )
    print(f"  Train Split:      {len(train_df):,} rows ({split_meta['train']['start'][:10]} to {split_meta['train']['end'][:10]})")
    print(f"  Validation Split: {len(val_df):,} rows ({split_meta['validation']['start'][:10]} to {split_meta['validation']['end'][:10]})")
    print(f"  Test Split:       {len(test_df):,} rows ({split_meta['test']['start'][:10]} to {split_meta['test']['end'][:10]})")
    print(f"  Sensors in Test:  {split_meta['test']['sensors']} ({split_meta['test']['seen_sensors_count']} seen, {split_meta['test']['unseen_sensors_count']} unseen)")

    # 5. Model Training & Uncertainty Calibration
    print("\n[Step 4/7] Training HistGradientBoosting Forecaster & Calibrating Uncertainty...")
    X_train = train_df[feature_names]
    y_train = train_df["pm25_target_24h"]

    X_val = val_df[feature_names]
    y_val = val_df["pm25_target_24h"]

    forecaster = PM25Forecaster(
        max_iter=150,
        learning_rate=0.08,
        min_samples_leaf=25,
        l2_regularization=0.1,
        transform_target=transform_target,
        random_state=42
    )

    t_train = time.time()
    forecaster.fit(X_train, y_train, X_val, y_val)
    train_duration = time.time() - t_train
    print(f"  Model trained in {train_duration:.2f}s using target transformation: '{transform_target}'.")
    print(f"  Empirical error quantiles calibrated: {forecaster.residual_quantiles}")

    # 6. Evaluation on Validation & Final Test Sets
    print("\n[Step 5/7] Evaluating Against Persistence Baseline on Identical Rows...")

    # Validation evaluation
    val_pred, val_low_80, val_up_80 = forecaster.predict_interval(X_val, coverage=0.80)
    val_eval_df = val_df[["record_id", "timestamp_utc", "city", "sensor_id", "season", "is_smog_season", "is_seen_sensor"]].copy()
    val_eval_df["actual"] = y_val.values
    val_eval_df["baseline"] = val_df["pm25_baseline_persistence"].values
    val_eval_df["predicted"] = val_pred
    val_eval_df["lower_80"] = val_low_80
    val_eval_df["upper_80"] = val_up_80

    val_analysis = comprehensive_error_analysis(val_eval_df)
    v_over = val_analysis["overall"]
    print(f"  Validation Baseline: MAE = {v_over['base_mae']:.3f}, RMSE = {v_over['base_rmse']:.3f}")
    print(f"  Validation Model:    MAE = {v_over['model_mae']:.3f}, RMSE = {v_over['model_rmse']:.3f}")
    print(f"  Validation Gain:     {v_over['mae_pct_improvement']:.2f}% MAE improvement ({v_over['mae_absolute_improvement']:.3f} µg/m³)")

    # Final Test evaluation (Preserved untouched until now!)
    X_test = test_df[feature_names]
    y_test = test_df["pm25_target_24h"]
    test_pred, test_low_80, test_up_80 = forecaster.predict_interval(X_test, coverage=0.80)
    _, test_low_90, test_up_90 = forecaster.predict_interval(X_test, coverage=0.90)

    test_eval_df = test_df[["record_id", "timestamp_utc", "city", "sensor_id", "season", "is_smog_season", "is_seen_sensor"]].copy()
    test_eval_df["actual"] = y_test.values
    test_eval_df["baseline"] = test_df["pm25_baseline_persistence"].values
    test_eval_df["predicted"] = test_pred
    test_eval_df["lower_80"] = test_low_80
    test_eval_df["upper_80"] = test_up_80
    test_eval_df["lower_90"] = test_low_90
    test_eval_df["upper_90"] = test_up_90

    test_analysis = comprehensive_error_analysis(test_eval_df)
    t_over = test_analysis["overall"]
    t_unc = test_analysis["uncertainty_80pct"]

    print("\n" + "-" * 60)
    print("FINAL UNTOUCHED TEST SET RESULTS:")
    print(f"  Baseline MAE:         {t_over['base_mae']:.3f} µg/m³")
    print(f"  Model MAE:            {t_over['model_mae']:.3f} µg/m³")
    print(f"  Absolute Improvement: {t_over['mae_absolute_improvement']:.3f} µg/m³")
    print(f"  Percentage Gain:      {t_over['mae_pct_improvement']:.2f}% (Beats Baseline: {t_over['beats_baseline']})")
    print(f"  Baseline RMSE:        {t_over['base_rmse']:.3f} µg/m³")
    print(f"  Model RMSE:           {t_over['model_rmse']:.3f} µg/m³")
    print(f"  80% Uncertainty Cov:  {t_unc['empirical_coverage_pct']:.2f}% (Mean Width: {t_unc['mean_interval_width']:.2f} µg/m³)")
    print("-" * 60)

    # 7. Save All Deliverable Artifacts
    print("\n[Step 6/7] Exporting Model, Metadata, Reports, and Predictions...")

    # Save Model
    model_path = models_dir / "pm25_forecaster.joblib"
    forecaster.save(model_path)
    print(f"  Model artifact saved to: {model_path}")

    # Save Feature & Split Metadata
    with open(metadata_dir / "feature_metadata.json", "w", encoding="utf-8") as f:
        json.dump(feat_audit, f, indent=2)

    with open(metadata_dir / "split_metadata.json", "w", encoding="utf-8") as f:
        json.dump(split_meta, f, indent=2)

    # Save Metrics & Error Analysis
    metrics_summary = {
        "execution_timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "model_type": "HistGradientBoostingRegressor",
        "target_transform": transform_target,
        "feature_count": len(feature_names),
        "train_rows": len(train_df),
        "validation_rows": len(val_df),
        "test_rows": len(test_df),
        "validation_metrics": val_analysis["overall"],
        "test_metrics": test_analysis["overall"],
        "test_uncertainty_80pct": test_analysis["uncertainty_80pct"],
        "test_seen_sensors": test_analysis["by_sensor_visibility"]["Seen in Training"],
        "test_unseen_sensors": test_analysis["by_sensor_visibility"]["Unseen in Training"],
        "test_by_city": test_analysis["by_city"],
        "test_by_season": test_analysis["by_season"]
    }

    with open(reports_dir / "metrics_summary.json", "w", encoding="utf-8") as f:
        json.dump(metrics_summary, f, indent=2)

    with open(reports_dir / "error_analysis.json", "w", encoding="utf-8") as f:
        json.dump(test_analysis, f, indent=2)

    error_df = error_analysis_to_dataframe(test_analysis)
    error_df.to_csv(reports_dir / "error_analysis.csv", index=False)
    print(f"  Error analysis saved to: {reports_dir / 'error_analysis.csv'}")

    # Save Predictions CSV (rounded to 2 decimal places for compact storage)
    pred_path = predictions_dir / "test_predictions.csv"
    pred_float_cols = ["predicted", "lower_80", "upper_80", "lower_90", "upper_90"]
    export_pred_df = test_eval_df.copy()
    export_pred_df[pred_float_cols] = export_pred_df[pred_float_cols].round(2)
    export_pred_df.to_csv(pred_path, index=False)
    print(f"  Machine-readable test predictions saved to: {pred_path}")

    # 8. Visualizations
    print("\n[Step 7/7] Generating Report & Dashboard Plots...")
    plot_ml_visualizations(test_eval_df, error_df, figures_dir)
    print(f"  Saved visual plots to: {figures_dir}")

    total_time = time.time() - t_start
    print("\n" + "=" * 80)
    print(f"SUCCESS: ALL ML DELIVERABLES GENERATED IN {total_time:.2f}s!")
    print("=" * 80)

    return metrics_summary


def main():
    parser = argparse.ArgumentParser(description="HackInsight 2026 PM2.5 ML Forecasting Pipeline")
    parser.add_argument("command", choices=["run", "train"], nargs="?", default="run", help="Pipeline execution command")
    parser.add_argument("--data-path", type=str, default="data/processed/gold_pm25_forecasting.parquet", help="Path to gold dataset")
    parser.add_argument("--output-dir", type=str, default="artifacts", help="Path to save artifacts")
    parser.add_argument("--transform", type=str, default="log1p", choices=["log1p", "none"], help="Target transformation")

    args = parser.parse_args()
    base_dir = Path(__file__).resolve().parent.parent.parent

    data_file = (base_dir / args.data_path).resolve()
    out_dir = (base_dir / args.output_dir).resolve()

    run_pipeline(data_file, out_dir, transform_target=args.transform)


if __name__ == "__main__":
    main()
