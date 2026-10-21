# Makefile for HackInsight 2026: Pakistan Air Quality PM2.5 Forecasting
# Team: DataMinors

.PHONY: help data test run pipeline quality lint clean

help:
	@echo "HackInsight 2026 - DataMinors Commands:"
	@echo "  make data      : Run full data pipeline (raw -> cleaned -> gold warehouse + DQ agent)"
	@echo "  make test      : Execute complete test suite (100+ unit, contract & integration tests)"
	@echo "  make run       : Launch local Streamlit application"
	@echo "  make pipeline  : Run Prefect hourly orchestration pipeline flow"
	@echo "  make quality   : Run Data Quality Agent assessment on gold dataset"

data:
	python -m src.data_pipeline.cli make-data

test:
	pytest

run:
	python -m streamlit run app.py

pipeline:
	python -m src.orchestration.flows

quality:
	python -m src.data_pipeline.validation.data_quality_agent

clean:
	rm -rf __pycache__ .pytest_cache
