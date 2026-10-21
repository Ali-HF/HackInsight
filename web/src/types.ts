export interface CityForecast {
  status: string;
  city: string;
  sensor_id: string;
  sensors_evaluated: number;
  forecast_issue_time: string;
  forecast_target_time: string;
  current_pm25: number;
  predicted_pm25_24h: number;
  lower_80: number;
  upper_80: number;
  baseline_persistence: number;
  coverage: number;
  unit: string;
  message: string;
  temperature_c?: number;
  humidity_pct?: number;
  wind_speed_ms?: number;
  precipitation_mm?: number;
}

export interface LatestForecastPayload {
  run_id: string;
  timestamp_utc: string;
  forecast_data: {
    issue_timestamp: string;
    horizon_hours: number;
    target_timestamp: string;
    cities: Record<string, CityForecast>;
  };
  validation: {
    status: string;
    total_records: number;
    valid_pm25_records: number;
    negative_readings: number;
    supported_cities: string[];
    latest_timestamp: string;
    validation_passed: boolean;
  };
}

export interface QualityAssessmentPayload {
  run_id: string;
  timestamp_utc: string;
  quality_assessment: {
    overall_status: 'PASS' | 'WARN' | 'FAIL';
    total_records_checked: number;
    records_affected_total: number;
    checks_run: number;
    actions_summary: {
      NO_ACTION: number;
      FLAG: number;
      FILL: number;
      FIX: number;
    };
    decisions: Array<{
      rule_id: string;
      check_id: string;
      action: string;
      severity: string;
      records_checked: number;
      records_affected: number;
      rationale: string;
      timestamp_utc: string;
    }>;
  };
}

export interface ModelMetricsPayload {
  execution_timestamp_utc: string;
  model_type: string;
  feature_count: number;
  train_rows: number;
  validation_rows: number;
  test_rows: number;
  test_metrics: {
    n: number;
    model_mae: number;
    model_rmse: number;
    base_mae: number;
    base_rmse: number;
    mae_pct_improvement: number;
    rmse_pct_improvement: number;
    beats_baseline: boolean;
  };
  test_uncertainty_80pct: {
    empirical_coverage_pct: number;
    target_coverage_pct: number;
    mean_interval_width: number;
  };
  test_by_city?: Record<string, {
    n: number;
    model_mae: number;
    model_rmse: number;
    base_mae: number;
    base_rmse: number;
    mae_pct_improvement: number;
    rmse_pct_improvement: number;
    beats_baseline: boolean;
  }>;
}

export interface TimeSeriesPoint {
  timestamp_utc: string;
  pm25: number;
}

export interface TrajectoryStep {
  step_hour: number;
  label: string;
  predicted_pm25: number;
  lower_80: number;
  upper_80: number;
  baseline: number;
}

export interface CityForecastTrajectory {
  history: Array<{ timestamp_utc: string; pm25: number; type: string }>;
  trajectory_24h: TrajectoryStep[];
  forecast_target: {
    target_time: string;
    predicted: number;
    lower_80: number;
    upper_80: number;
    baseline: number;
  };
}
