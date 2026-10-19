"""
Audit Trail Logger for Insight Agent.
HackInsight 2026 - Member 3: Insight / RAG Agent.

Tracks question, tool dispatch, evidence retrieved, validation/warnings,
and final grounded response. Excludes API keys, secrets, or sensitive tokens.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from pathlib import Path
import json


@dataclass
class AuditStep:
    step_id: int
    step_type: str  # 'intent_routing' | 'tool_call' | 'evidence_collection' | 'grounding_check' | 'response_generation'
    details: Dict[str, Any]
    timestamp_utc: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class AgentAuditRecord:
    interaction_id: str
    question: str
    selected_tools: List[str]
    tool_inputs: Dict[str, Any]
    evidence_retrieved: Dict[str, Any]
    warnings_flags: List[str]
    grounding_passed: bool
    final_answer: str
    steps: List[Dict[str, Any]]
    created_at_utc: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AuditTrail:
    """Manages structured in-memory and persistent audit trails for agent decisions."""

    def __init__(self, log_dir: Optional[Path] = None):
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.log_dir = Path(log_dir) if log_dir else base_dir / "reports" / "agent_audit"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.records: List[AgentAuditRecord] = []

    def create_record(
        self,
        interaction_id: str,
        question: str,
        selected_tools: List[str],
        tool_inputs: Dict[str, Any],
        evidence_retrieved: Dict[str, Any],
        warnings_flags: List[str],
        grounding_passed: bool,
        final_answer: str,
        steps: List[AuditStep]
    ) -> AgentAuditRecord:
        """Create and store an audit record, sanitizing any secret keys."""
        sanitized_inputs = {k: v for k, v in tool_inputs.items() if "secret" not in k.lower() and "key" not in k.lower()}
        
        record = AgentAuditRecord(
            interaction_id=interaction_id,
            question=question,
            selected_tools=selected_tools,
            tool_inputs=sanitized_inputs,
            evidence_retrieved=evidence_retrieved,
            warnings_flags=warnings_flags,
            grounding_passed=grounding_passed,
            final_answer=final_answer,
            steps=[asdict(s) for s in steps]
        )
        self.records.append(record)
        return record

    def save_audit_log(self, filepath: Optional[Path] = None) -> Path:
        """Save audit records to JSON on disk."""
        target = Path(filepath) if filepath else self.log_dir / "agent_audit_log.json"
        with open(target, "w", encoding="utf-8") as f:
            json.dump([asdict(r) for r in self.records], f, indent=2)
        return target
