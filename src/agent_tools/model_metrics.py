"""
Model Metrics Retrieval Tool.
HackInsight 2026 - Member 3: Insight / RAG Agent.

Retrieves verified model evaluation metrics from official ML artifacts.
Strictly eliminates hallucinated accuracy and error statistics.
"""

from typing import Dict, Any, Optional
from pathlib import Path
import json


def get_model_metrics(
    city: Optional[str] = None,
    metric_type: Optional[str] = None,
    metrics_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Retrieve authoritative model performance and evaluation metrics.

    Args:
        city: Optional city to filter city-specific test metrics ('Lahore', 'Karachi').
        metric_type: Optional sub-metric ('test_metrics', 'validation_metrics', 'test_by_city', 'test_uncertainty_80pct').
        metrics_path: Optional custom path to metrics_summary.json.

    Returns:
        Dict containing model evaluation statistics, baseline comparisons, and coverage.
    """
    base_dir = Path(__file__).resolve().parent.parent.parent
    path = Path(metrics_path) if metrics_path else base_dir / "artifacts" / "reports" / "metrics_summary.json"

    if not path.is_file():
        return {
            "status": "error",
            "metrics": None,
            "message": f"Metrics summary artifact not found at '{path}'."
        }

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as exc:
        return {
            "status": "error",
            "metrics": None,
            "message": f"Failed reading metrics artifact: {str(exc)}"
        }

    # Normalize city if requested
    if city:
        normalized_city = city.strip().capitalize()
        city_metrics = data.get("test_by_city", {}).get(normalized_city)
        if not city_metrics:
            return {
                "status": "unsupported_city",
                "city": city,
                "metrics": None,
                "message": f"No specific evaluation metrics found for city '{city}'."
            }

        return {
            "status": "success",
            "city": normalized_city,
            "model_type": data.get("model_type"),
            "sample_size": city_metrics.get("n"),
            "model_mae": city_metrics.get("model_mae"),
            "model_rmse": city_metrics.get("model_rmse"),
            "baseline_mae": city_metrics.get("base_mae"),
            "baseline_rmse": city_metrics.get("base_rmse"),
            "mae_pct_improvement": city_metrics.get("mae_pct_improvement"),
            "rmse_pct_improvement": city_metrics.get("rmse_pct_improvement"),
            "beats_baseline": city_metrics.get("beats_baseline"),
            "message": (
                f"In {normalized_city}, model achieved MAE of {city_metrics.get('model_mae')} ug/m3 "
                f"vs baseline {city_metrics.get('base_mae')} ug/m3 ({city_metrics.get('mae_pct_improvement')}% improvement)."
            )
        }

    # If specific sub-metric requested
    if metric_type and metric_type in data:
        return {
            "status": "success",
            "metric_type": metric_type,
            "data": data[metric_type],
            "message": f"Retrieved metrics for {metric_type}."
        }

    # Return overall standard metrics summary
    test_m = data.get("test_metrics", {})
    unc_m = data.get("test_uncertainty_80pct", {})
    return {
        "status": "success",
        "model_type": data.get("model_type"),
        "test_rows": data.get("test_rows"),
        "model_mae": test_m.get("model_mae"),
        "model_rmse": test_m.get("model_rmse"),
        "baseline_mae": test_m.get("base_mae"),
        "baseline_rmse": test_m.get("base_rmse"),
        "mae_pct_improvement": test_m.get("mae_pct_improvement"),
        "rmse_pct_improvement": test_m.get("rmse_pct_improvement"),
        "beats_baseline": test_m.get("beats_baseline"),
        "uncertainty_coverage_80": unc_m.get("empirical_coverage_pct"),
        "mean_interval_width": unc_m.get("mean_interval_width"),
        "city_breakdown": {
            "Lahore_mae": data.get("test_by_city", {}).get("Lahore", {}).get("model_mae"),
            "Karachi_mae": data.get("test_by_city", {}).get("Karachi", {}).get("model_mae")
        },
        "message": (
            f"Model ({data.get('model_type')}) test MAE: {test_m.get('model_mae')} ug/m3 "
            f"(beats persistence baseline {test_m.get('base_mae')} ug/m3 by {test_m.get('mae_pct_improvement')}%). "
            f"80% empirical interval coverage: {unc_m.get('empirical_coverage_pct')}%."
        )
    }
