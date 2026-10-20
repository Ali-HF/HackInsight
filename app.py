"""
Pakistan PM2.5 Forecasting and Decision-Support System.
Hugging Face Space & Application Entrypoint.
HackInsight 2026 - Member 4: Orchestration, Integration, Dashboard & Deployment.
"""

import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Launch primary Streamlit dashboard
import src.dashboard.app
