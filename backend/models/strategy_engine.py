"""
Strategy Recommendation Engine
Maps (frustration_score, emotion, history_flags, customer_tier) → Response Strategy
Uses a tiered rule system with probabilistic overrides.
"""
from typing import Dict, List, Optional


STRATEGIES = {
    0: {
        "id": 0,
        "level": "standard",
        "label": "Standard Response",
        "color": "#34C759",
        "bg": "#0D2818",
        "border": "#34C759",
        "urgency": "LOW",
        "icon": "✅",
        "actions": [
            "Greet the customer normally",
            "Ask clarifying questions to understand the issue",
            "Follow standard resolution flow",
            "Offer knowledge base articles if appropriate",
        ],
        "tone_guidance": "Friendly and helpful. Use standard greeting. Take time to diagnose.",
        "skip_greeting": False,
        "escalate_human": False,
        "offer_credit": False,
        "flag_churn_risk": False,
    },
    1: {
        "id": 1,
        "level": "empathy",
        "label": "Acknowledge & Empathize",
        "color": "#FFD60A",
        "bg": "#2A1F00",
        "border": "#FFD60A",
        "urgency": "MODERATE",
        "icon": "💛",
        "actions": [
            "Lead with acknowledgment before problem-solving",
            "Validate their frustration explicitly",
            "Set clear expectations on resolution timeline",
            "Follow up proactively after resolution",
        ],
        "tone_guidance": "Warm and patient. Acknowledge their experience before jumping to solutions.",
        "skip_greeting": False,
        "escalate_human": False,
        "offer_credit": False,
        "flag_churn_risk": False,
    },
    2: {
        "id": 2,
        "level": "escalate",
        "label": "Skip Script — Escalate to Human",
        "color": "#FF9F0A",
        "bg": "#2A1500",
        "border": "#FF9F0A",
        "urgency": "HIGH",
        "icon": "⚡",
        "actions": [
            "Skip automated greeting entirely",
            "Acknowledge the recurring issue by name",
            "Route immediately to senior support agent",
            "Brief the agent on full history before handoff",
        ],
        "tone_guidance": "Skip the script. Get straight to it. This person has heard pleasantries enough.",
        "skip_greeting": True,
        "escalate_human": True,
        "offer_credit": False,
        "flag_churn_risk": False,
    },
    3: {
        "id": 3,
        "level": "churn_risk",
        "label": "Churn Risk — Proactive Intervention",
        "color": "#FF6B35",
        "bg": "#2A0D00",
        "border": "#FF6B35",
        "urgency": "CRITICAL",
        "icon": "🚨",
        "actions": [
            "Skip greeting — acknowledge delay and recurring issue directly",
            "Escalate to senior human agent immediately",
            "Pre-authorize 1-month goodwill credit before customer asks",
            "Assign dedicated case owner — no more ticket transfers",
            "Flag account for executive review",
        ],
        "tone_guidance": "No script. No wait. Acknowledge, own the failure, offer immediate remedy.",
        "skip_greeting": True,
        "escalate_human": True,
        "offer_credit": True,
        "flag_churn_risk": True,
    },
    4: {
        "id": 4,
        "level": "emergency",
        "label": "Priority Intervention — Do Not Let Go",
        "color": "#FF2D55",
        "bg": "#2A0010",
        "border": "#FF2D55",
        "urgency": "EMERGENCY",
        "icon": "🔥",
        "actions": [
            "Interrupt current queue — handle immediately",
            "Manager-level escalation, not just senior agent",
            "Acknowledge every prior failed resolution explicitly",
            "Pre-authorize extended credit or partial refund",
            "Dedicated account rep assigned — SLA locked in writing",
            "CEO/Head of Support notified if enterprise tier",
        ],
        "tone_guidance": "This is a save-or-lose moment. Lead with accountability. No excuses.",
        "skip_greeting": True,
        "escalate_human": True,
        "offer_credit": True,
        "flag_churn_risk": True,
    },
}


def recommend_strategy(
    frustration_score: float,
    emotion_raw: str,
    trajectory: str,
    churn_probability: float,
    flags: List[str],
    num_past_tickets: int,
    plan_tier: str = "standard",
    unresolved_count: int = 0,
) -> Dict:
    """
    Determine the recommended response strategy.
    Returns full strategy dict with reasoning.
    """

    tier_multiplier = {
        "enterprise": 1.3,
        "pro": 1.15,
        "standard": 1.0,
        "free": 0.9,
    }.get(plan_tier.lower(), 1.0)

    effective_score = min(10.0, frustration_score * tier_multiplier)

    # Base strategy from score
    if effective_score < 3.5:
        strategy_id = 0
    elif effective_score < 5.5:
        strategy_id = 1
    elif effective_score < 7.0:
        strategy_id = 2
    elif effective_score < 8.5:
        strategy_id = 3
    else:
        strategy_id = 4

    # Override upgrades based on flags and signals
    if "silent_return_signal" in flags and strategy_id < 3:
        strategy_id = 3

    if "multiple_unresolved" in flags and unresolved_count >= 3 and strategy_id < 3:
        strategy_id = 3

    if trajectory == "escalating" and strategy_id < 2:
        strategy_id = 2

    if emotion_raw in ("furious",) and strategy_id < 3:
        strategy_id = 3

    if churn_probability >= 0.85 and strategy_id < 4:
        strategy_id = 4

    if num_past_tickets >= 5 and strategy_id < 3:
        strategy_id = 3

    strategy = STRATEGIES[strategy_id].copy()

    # Build human-readable reasoning
    reasons = []
    if frustration_score >= 7:
        reasons.append(f"Frustration score {frustration_score}/10 — dangerously high")
    elif frustration_score >= 5:
        reasons.append(f"Frustration score {frustration_score}/10 — elevated")
    
    if num_past_tickets > 0:
        reasons.append(f"{num_past_tickets} prior {'ticket' if num_past_tickets == 1 else 'tickets'} on record")
    
    if unresolved_count > 0:
        reasons.append(f"{unresolved_count} unresolved {'issue' if unresolved_count == 1 else 'issues'} in history")
    
    if "repeat_issue_pattern" in flags:
        reasons.append("Repeat issue pattern detected — same problem, multiple tickets")
    
    if "silent_return_signal" in flags:
        reasons.append("Silent return signal — went quiet, now back — high churn risk")
    
    if trajectory == "escalating":
        reasons.append("Emotional trajectory: escalating over time")
    
    if churn_probability >= 0.7:
        reasons.append(f"Churn probability {int(churn_probability * 100)}% — intervention critical")

    strategy["reasoning"] = reasons
    strategy["effective_score"] = round(effective_score, 1)
    strategy["plan_tier"] = plan_tier

    return strategy


def get_strategy_summary(strategy: Dict, frustration_data: Dict, customer_name: str = "the customer") -> str:
    """Generate the natural language strategy card text."""
    actions = strategy.get("actions", [])
    score = frustration_data.get("frustration_score", 0)
    trajectory = frustration_data.get("trajectory", "stable")
    
    summary_lines = []
    
    if strategy["level"] in ("churn_risk", "emergency"):
        summary_lines.append(f"⚠️ Do NOT use standard greeting. {customer_name} has {frustration_data.get('interaction_count', 0)} prior interactions.")
    
    summary_lines.append(f"Frustration trajectory is {trajectory}.")
    summary_lines.append(f"Recommended: {strategy['label']}.")
    
    for action in actions[:3]:
        summary_lines.append(f"• {action}")
    
    return " ".join(summary_lines)
