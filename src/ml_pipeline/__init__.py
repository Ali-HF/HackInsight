"""
HackInsight 2026 - Machine Learning Forecasting Pipeline.
Member 2: ML Engineer.

Module for leakage-safe 24-hour-ahead PM2.5 forecasting in Pakistan (Lahore & Karachi).
"""

__version__ = "1.0.0"

from src.ml_pipeline.inference import predict_pm25_24h

__all__ = ["predict_pm25_24h"]

