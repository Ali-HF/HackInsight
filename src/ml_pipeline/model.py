"""
Model Architecture and Training Module for PM2.5 24h Forecasting.
HackInsight 2026 - Member 2: Machine Learning.

Principles:
1. Fast, robust tabular gradient boosting (HistGradientBoostingRegressor).
2. Right-skew stabilization: log1p target transformation with inverse expm1.
3. Empirical uncertainty estimation: residual error quantiles calibrated on validation set.
4. Physical bounding: predicted concentrations lower-bounded at 1.0 ug/m3.
5. Deterministic reproducibility: fixed random_state for all operations.
"""

from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor


class PM25Forecaster:
    """
    Leakage-safe 24-hour ahead PM2.5 gradient boosting forecaster with
    empirical prediction intervals.
    """

    def __init__(
        self,
        max_iter: int = 150,
        learning_rate: float = 0.08,
        min_samples_leaf: int = 25,
        l2_regularization: float = 0.1,
        transform_target: str = "log1p",
        random_state: int = 42
    ):
        """
        Initialize the forecaster.

        Args:
            max_iter: Maximum boosting iterations / trees.
            learning_rate: Step size shrinkage.
            min_samples_leaf: Minimum samples required in leaf nodes.
            l2_regularization: L2 regularization penalty.
            transform_target: 'log1p' or 'none'.
            random_state: Seed for reproducibility.
        """
        self.max_iter = max_iter
        self.learning_rate = learning_rate
        self.min_samples_leaf = min_samples_leaf
        self.l2_regularization = l2_regularization
        self.transform_target = transform_target
        self.random_state = random_state

        self.model = HistGradientBoostingRegressor(
            max_iter=self.max_iter,
            learning_rate=self.learning_rate,
            min_samples_leaf=self.min_samples_leaf,
            l2_regularization=self.l2_regularization,
            random_state=self.random_state
        )

        self.feature_names: List[str] = []
        self.residual_quantiles: Dict[str, float] = {}
        self.is_fitted: bool = False
        self.tier_threshold: Optional[float] = None
        self.tier_multiplier: Optional[float] = None

    def _transform_y(self, y: np.ndarray) -> np.ndarray:
        if self.transform_target == "log1p":
            return np.log1p(np.maximum(y, 0.0))
        return y

    def _inverse_transform_y(self, y_trans: np.ndarray) -> np.ndarray:
        if self.transform_target == "log1p":
            return np.maximum(np.expm1(y_trans), 1.0)
        return np.maximum(y_trans, 1.0)

    def fit(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: Optional[pd.DataFrame] = None,
        y_val: Optional[pd.Series] = None,
        sample_weight: Optional[np.ndarray] = None,
        use_tier_weighting: bool = False,
        tier_threshold_quantile: float = 0.75,
        tier_multiplier: float = 1.5
    ) -> "PM25Forecaster":
        """
        Fit the model on training data and calibrate empirical prediction
        interval quantiles on validation residuals.
        """
        self.feature_names = list(X_train.columns)
        y_t = self._transform_y(y_train.values)

        if use_tier_weighting and sample_weight is None:
            q_thresh = float(np.percentile(y_train.values, tier_threshold_quantile * 100))
            w = np.ones(len(y_train), dtype=np.float64)
            w[y_train.values >= q_thresh] = tier_multiplier
            sample_weight = w / np.mean(w)
            self.tier_threshold = q_thresh
            self.tier_multiplier = tier_multiplier
        elif sample_weight is not None:
            sample_weight = sample_weight / np.mean(sample_weight)

        self.model.fit(X_train[self.feature_names], y_t, sample_weight=sample_weight)
        self.is_fitted = True

        # Calibrate prediction intervals using validation residuals
        if X_val is not None and y_val is not None:
            self.calibrate_intervals(X_val, y_val)

        return self

    def calibrate_intervals(self, X_val: pd.DataFrame, y_val: pd.Series) -> Dict[str, float]:
        """
        Compute empirical error quantiles on validation set.
        """
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before calibrating intervals!")

        val_pred_trans = self.model.predict(X_val[self.feature_names])
        val_pred = self._inverse_transform_y(val_pred_trans)
        y_v = y_val.values

        if self.transform_target == "log1p":
            # Multiplicative / log-space residuals: log(1+y) - log(1+y_hat)
            log_res = np.log1p(y_v) - np.log1p(val_pred)
            self.residual_quantiles = {
                "q05_log": float(np.percentile(log_res, 5)),
                "q10_log": float(np.percentile(log_res, 10)),
                "q25_log": float(np.percentile(log_res, 25)),
                "q75_log": float(np.percentile(log_res, 75)),
                "q90_log": float(np.percentile(log_res, 90)),
                "q95_log": float(np.percentile(log_res, 95))
            }
        else:
            res = y_v - val_pred
            self.residual_quantiles = {
                "q05": float(np.percentile(res, 5)),
                "q10": float(np.percentile(res, 10)),
                "q25": float(np.percentile(res, 25)),
                "q75": float(np.percentile(res, 75)),
                "q90": float(np.percentile(res, 90)),
                "q95": float(np.percentile(res, 95))
            }

        return self.residual_quantiles

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Generate point forecasts for PM2.5 at t+24h.
        """
        if not self.is_fitted:
            raise RuntimeError("Model is not fitted!")

        pred_trans = self.model.predict(X[self.feature_names])
        point_pred = self._inverse_transform_y(pred_trans)
        return point_pred

    def predict_interval(
        self,
        X: pd.DataFrame,
        coverage: float = 0.80
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Generate point predictions alongside prediction intervals.

        Args:
            X: Input feature DataFrame.
            coverage: Desired interval coverage (0.80 for 80% interval, 0.90 for 90%).

        Returns:
            Tuple of (point_prediction, lower_bound, upper_bound).
        """
        point_pred = self.predict(X)

        if not self.residual_quantiles:
            # Fallback if no calibration data provided: +/- 20%
            lower = np.maximum(point_pred * (1.0 - (1.0 - coverage)), 1.0)
            upper = point_pred * (1.0 + (1.0 - coverage))
            return point_pred, lower, upper

        if self.transform_target == "log1p":
            if np.isclose(coverage, 0.80):
                q_low = self.residual_quantiles["q10_log"]
                q_high = self.residual_quantiles["q90_log"]
            elif np.isclose(coverage, 0.90):
                q_low = self.residual_quantiles["q05_log"]
                q_high = self.residual_quantiles["q95_log"]
            else:
                q_low = self.residual_quantiles["q10_log"]
                q_high = self.residual_quantiles["q90_log"]

            # Lower bound = exp(log(1 + pred) + q_low) - 1
            lower = np.maximum(np.expm1(np.log1p(point_pred) + q_low), 1.0)
            upper = np.expm1(np.log1p(point_pred) + q_high)
        else:
            if np.isclose(coverage, 0.80):
                q_low = self.residual_quantiles["q10"]
                q_high = self.residual_quantiles["q90"]
            elif np.isclose(coverage, 0.90):
                q_low = self.residual_quantiles["q05"]
                q_high = self.residual_quantiles["q95"]
            else:
                q_low = self.residual_quantiles["q10"]
                q_high = self.residual_quantiles["q90"]

            lower = np.maximum(point_pred + q_low, 1.0)
            upper = point_pred + q_high

        return point_pred, lower, upper

    def save(self, filepath: Path) -> Path:
        """
        Serialize model artifacts to disk using joblib.
        """
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)
        return path

    @classmethod
    def load(cls, filepath: Path) -> "PM25Forecaster":
        """
        Load serialized model artifact.
        """
        path = Path(filepath)
        if not path.is_file():
            raise FileNotFoundError(f"Model artifact not found at {path}")
        
        # Compatibility shims for unpickling models saved across scikit-learn versions
        import sys
        try:
            import sklearn._loss
            if "_loss" not in sys.modules:
                sys.modules["_loss"] = sklearn._loss
            if hasattr(sklearn._loss, "HalfSquaredError") and not hasattr(sklearn._loss, "CyHalfSquaredError"):
                sklearn._loss.CyHalfSquaredError = sklearn._loss.HalfSquaredError
        except (ImportError, AttributeError):
            pass

        import warnings
        from sklearn.exceptions import InconsistentVersionWarning
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", category=InconsistentVersionWarning)
            forecaster = joblib.load(path)
        return forecaster

