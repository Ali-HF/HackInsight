"""
Evaluation and Error Analysis Module for PM2.5 Forecasting.
HackInsight 2026 - Member 2: Machine Learning.

Principles:
1. Identical evaluation rows: persistence baseline is evaluated on the exact same
   subset of rows as the ML model.
2. Group disaggregation: evaluate performance across City, Season, Pollution Tier,
   and Seen vs. Unseen sensor entities.
3. Underperformance auditing: explicitly identify sub-cohorts where model underperforms
   the persistence baseline.
4. Uncertainty verification: empirically evaluate prediction interval coverage and width.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calculate standard point forecast regression metrics."""
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    return {"mae": round(mae, 3), "rmse": round(rmse, 3)}


def evaluate_slice(
    df_slice: pd.DataFrame,
    actual_col: str = "actual",
    pred_col: str = "predicted",
    base_col: str = "baseline"
) -> Dict[str, Any]:
    """Calculate comparative model vs baseline metrics for a single slice."""
    n = len(df_slice)
    if n == 0:
        return {"n": 0, "model_mae": None, "base_mae": None, "mae_pct_improvement": None}

    y_t = df_slice[actual_col].values
    y_p = df_slice[pred_col].values
    y_b = df_slice[base_col].values

    m_metrics = calculate_metrics(y_t, y_p)
    b_metrics = calculate_metrics(y_t, y_b)

    abs_mae_imp = b_metrics["mae"] - m_metrics["mae"]
    pct_mae_imp = ((b_metrics["mae"] - m_metrics["mae"]) / b_metrics["mae"]) * 100.0 if b_metrics["mae"] > 0 else 0.0

    abs_rmse_imp = b_metrics["rmse"] - m_metrics["rmse"]
    pct_rmse_imp = ((b_metrics["rmse"] - m_metrics["rmse"]) / b_metrics["rmse"]) * 100.0 if b_metrics["rmse"] > 0 else 0.0

    return {
        "n": n,
        "model_mae": m_metrics["mae"],
        "model_rmse": m_metrics["rmse"],
        "base_mae": b_metrics["mae"],
        "base_rmse": b_metrics["rmse"],
        "mae_absolute_improvement": round(abs_mae_imp, 3),
        "mae_pct_improvement": round(pct_mae_imp, 2),
        "rmse_absolute_improvement": round(abs_rmse_imp, 3),
        "rmse_pct_improvement": round(pct_rmse_imp, 2),
        "beats_baseline": bool(m_metrics["mae"] < b_metrics["mae"])
    }


def comprehensive_error_analysis(
    eval_df: pd.DataFrame,
    actual_col: str = "actual",
    pred_col: str = "predicted",
    base_col: str = "baseline",
    lower_col: Optional[str] = "lower_80",
    upper_col: Optional[str] = "upper_80"
) -> Dict[str, Any]:
    """
    Perform multi-dimensional error analysis across City, Season, Pollution Tier,
    and Seen vs. Unseen sensor groups.
    """
    results: Dict[str, Any] = {}

    # 1. Overall
    results["overall"] = evaluate_slice(eval_df, actual_col, pred_col, base_col)

    # 2. Prediction interval coverage
    if lower_col in eval_df.columns and upper_col in eval_df.columns:
        cov = ((eval_df[actual_col] >= eval_df[lower_col]) & (eval_df[actual_col] <= eval_df[upper_col])).mean()
        mean_width = (eval_df[upper_col] - eval_df[lower_col]).mean()
        results["uncertainty_80pct"] = {
            "empirical_coverage_pct": round(float(cov * 100.0), 2),
            "target_coverage_pct": 80.0,
            "mean_interval_width": round(float(mean_width), 2)
        }

    # 3. By City
    results["by_city"] = {}
    for city, c_df in eval_df.groupby("city"):
        results["by_city"][str(city)] = evaluate_slice(c_df, actual_col, pred_col, base_col)

    # 4. By Season
    results["by_season"] = {}
    season_names = {1: "DJF (Winter/Smog)", 2: "MAM (Spring)", 3: "JJA (Monsoon)", 4: "SON (Autumn)"}
    for s_code, s_df in eval_df.groupby("season"):
        name = season_names.get(int(s_code), str(s_code))
        results["by_season"][name] = evaluate_slice(s_df, actual_col, pred_col, base_col)

    # 5. By Smog Season
    if "is_smog_season" in eval_df.columns:
        results["by_smog_season"] = {
            "Smog Season (Oct-Feb)": evaluate_slice(eval_df[eval_df["is_smog_season"] == 1], actual_col, pred_col, base_col),
            "Non-Smog Season (Mar-Sep)": evaluate_slice(eval_df[eval_df["is_smog_season"] == 0], actual_col, pred_col, base_col)
        }

    # 6. By Seen vs Unseen Sensor
    if "is_seen_sensor" in eval_df.columns:
        results["by_sensor_visibility"] = {
            "Seen in Training": evaluate_slice(eval_df[eval_df["is_seen_sensor"] == 1], actual_col, pred_col, base_col),
            "Unseen in Training": evaluate_slice(eval_df[eval_df["is_seen_sensor"] == 0], actual_col, pred_col, base_col)
        }

    # 7. By Pollution Tier (quantiles: Low <= 25%, Med 25-75%, High > 75%)
    q25 = eval_df[actual_col].quantile(0.25)
    q75 = eval_df[actual_col].quantile(0.75)
    q90 = eval_df[actual_col].quantile(0.90)

    low_df = eval_df[eval_df[actual_col] <= q25]
    med_df = eval_df[(eval_df[actual_col] > q25) & (eval_df[actual_col] <= q75)]
    high_df = eval_df[eval_df[actual_col] > q75]
    top_decile_df = eval_df[eval_df[actual_col] >= q90]

    results["by_pollution_tier"] = {
        f"Low (<= {q25:.1f} ug/m3)": evaluate_slice(low_df, actual_col, pred_col, base_col),
        f"Medium ({q25:.1f} - {q75:.1f} ug/m3)": evaluate_slice(med_df, actual_col, pred_col, base_col),
        f"High (> {q75:.1f} ug/m3)": evaluate_slice(high_df, actual_col, pred_col, base_col),
        f"Top Decile (>= {q90:.1f} ug/m3)": evaluate_slice(top_decile_df, actual_col, pred_col, base_col)
    }

    # 8. Slices where model underperforms baseline
    underperforming = []
    for category, cat_dict in results.items():
        if isinstance(cat_dict, dict) and "beats_baseline" in cat_dict:
            if not cat_dict["beats_baseline"]:
                underperforming.append({"group": category, **cat_dict})
        elif isinstance(cat_dict, dict):
            for sub_k, sub_v in cat_dict.items():
                if isinstance(sub_v, dict) and "beats_baseline" in sub_v:
                    if not sub_v["beats_baseline"]:
                        underperforming.append({"group": f"{category} -> {sub_k}", **sub_v})

    results["underperforming_cohorts"] = underperforming

    return results


def error_analysis_to_dataframe(analysis: Dict[str, Any]) -> pd.DataFrame:
    """Flatten error analysis results into a clean tabular DataFrame."""
    rows = []
    for cat, val in analysis.items():
        if cat in ["uncertainty_80pct", "underperforming_cohorts"]:
            continue
        if "beats_baseline" in val:
            rows.append({"category": "Overall", "slice": "All Records", **val})
        elif isinstance(val, dict):
            for sub_k, sub_v in val.items():
                if isinstance(sub_v, dict) and "beats_baseline" in sub_v:
                    rows.append({"category": cat, "slice": sub_k, **sub_v})
    return pd.DataFrame(rows)
