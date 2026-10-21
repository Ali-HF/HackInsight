"""
Integration Interface for Member 4 & Dashboard.
HackInsight 2026 - Member 3: Insight / RAG Agent.

Provides one clean, intuitive interface for Member 4:
answer_question(question) -> dict
"""

from typing import Dict, Any, Optional
from src.insight_agent.agent import InsightRAGAgent

# Singleton instance for high performance and state retention
_AGENT_INSTANCE: Optional[InsightRAGAgent] = None


def get_agent() -> InsightRAGAgent:
    """Return or initialize global InsightRAGAgent instance."""
    global _AGENT_INSTANCE
    if _AGENT_INSTANCE is None:
        _AGENT_INSTANCE = InsightRAGAgent()
    return _AGENT_INSTANCE


def answer_question(question: str, language: str = "en") -> Dict[str, Any]:
    """
    Clean primary interface for Member 4 (Dashboard & Prefect flow).

    Args:
        question: Natural language question regarding PM2.5, forecasts, air quality, or data quality.
        language: Language code ('en' for English, 'ur' for Urdu / اردو). Default: 'en'.

    Returns:
        Dict formatted for dashboard consumption:
            - answer: Grounded natural-language response.
            - status: 'success' | 'unsupported' | 'missing_evidence' | 'out_of_scope'
            - language: Language of the response ('en' or 'ur').
            - evidence: Structured dictionary of verified numerical claims.
            - citations: List of authoritative sources / guidelines.
            - warnings: Quality warnings or alerts.
            - tools_used: List of deterministic tools executed.
            - grounding_passed: Boolean verification that no numbers were hallucinated.
            - interaction_id: Unique audit trace identifier.
    """
    agent = get_agent()
    return agent.answer_question(question, language=language)
