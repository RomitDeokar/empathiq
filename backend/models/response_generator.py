"""
EmpathIQ — Response Generator
Uses facebook/blenderbot-400M-distill for offline text generation.
Generates two things:
  1. Suggested agent reply (strategy-aware, emotion-aware)
  2. Customer-facing chat responses
"""

from typing import Optional, List, Dict

_chat_pipeline = None
_tokenizer = None
_model = None


def _load_model():
    global _chat_pipeline, _tokenizer, _model
    if _chat_pipeline is not None:
        return

    try:
        from transformers import BlenderbotTokenizer, BlenderbotForConditionalGeneration
        import torch

        model_name = "facebook/blenderbot-400M-distill"
        print("[ResponseGenerator] Loading BlenderBot-400M...")

        _tokenizer = BlenderbotTokenizer.from_pretrained(model_name)
        _model = BlenderbotForConditionalGeneration.from_pretrained(model_name)
        _model.eval()

        print("[ResponseGenerator] BlenderBot loaded and ready.")
        _chat_pipeline = "ready"

    except Exception as e:
        print(f"[ResponseGenerator] Model load failed ({e}), using template fallback.")
        _chat_pipeline = "fallback"


# ─── Template fallback responses ─────────────────────────────────────────────

STRATEGY_TEMPLATES = {
    "emergency": [
        "I'm so sorry for everything you've been through with us. I'm personally taking ownership of this right now — no more transfers, no more waiting. Let me fix this immediately.",
        "I completely understand your frustration, and honestly, you have every right to feel this way. I'm escalating this to our highest priority right now and I will not let go until it's resolved.",
        "This is unacceptable and I take full responsibility. I'm stopping everything else to focus on your issue. You have my direct commitment that this gets resolved today.",
    ],
    "churn_risk": [
        "I can see you've been dealing with this for too long and I sincerely apologize. I'm routing you directly to our senior team right now — no more scripts, just a real fix.",
        "Your frustration is completely valid. I'm flagging your account for priority handling and reaching out to our senior support team right now.",
        "I'm really sorry this has taken so long. I'm taking direct ownership of this ticket and won't close it until you confirm it's actually resolved.",
    ],
    "escalate": [
        "I hear you, and I want to skip past the usual back-and-forth. Let me connect you directly with someone who can actually resolve this today.",
        "Thank you for your patience — I know it's been a lot. I'm connecting you with a senior agent who has full context on your situation.",
        "I understand this has been frustrating. I'm escalating this now so you get a real resolution, not just another workaround.",
    ],
    "empathy": [
        "Thank you for reaching out. I can see there's been some frustration here and I want to make sure we get this right for you.",
        "I appreciate you letting us know. Let me look into this carefully and make sure we give you a proper resolution this time.",
        "I understand this has been inconvenient. I'm going to take the time to properly understand your situation and help you through this.",
    ],
    "standard": [
        "Thanks for reaching out! I'd be happy to help you with this. Let me take a look and get back to you with the right information.",
        "Hi there! Thanks for contacting us. I'll look into this for you right away.",
        "Hello! I'm here to help. Let me pull up your account details and we'll get this sorted out for you.",
    ],
}

EMOTION_PREFIXES = {
    "furious":    "I completely understand why you're angry, and I take full responsibility. ",
    "angry":      "I hear your frustration and I'm truly sorry. ",
    "escalating": "I can see this has been building up and that's completely understandable. ",
    "annoyed":    "I'm sorry for the inconvenience this has caused you. ",
    "defeated":   "I can hear how exhausted you are with this situation, and I'm truly sorry. ",
    "confused":   "Of course, let me clear this up for you right away. ",
    "calm":       "",
    "neutral":    "",
}


def _template_reply(strategy_level: str, emotion_raw: str, is_agent: bool = True) -> str:
    import random
    templates = STRATEGY_TEMPLATES.get(strategy_level, STRATEGY_TEMPLATES["standard"])
    base = random.choice(templates)
    prefix = EMOTION_PREFIXES.get(emotion_raw, "") if is_agent else ""
    return prefix + base


# ─── BlenderBot generation ────────────────────────────────────────────────────

def _build_agent_context(
    strategy_level: str,
    emotion_raw: str,
    frustration_score: float,
    customer_name: str,
    num_tickets: int,
    issue_category: str,
) -> str:
    """Build a context string that primes BlenderBot toward the right tone."""
    tone_map = {
        "emergency":   "urgent, deeply apologetic, take full ownership, skip pleasantries",
        "churn_risk":  "apologetic, empathetic, escalate immediately, offer goodwill",
        "escalate":    "skip script, acknowledge issue directly, route to senior agent",
        "empathy":     "warm, acknowledge frustration, set clear expectations",
        "standard":    "friendly, helpful, ask clarifying questions",
    }
    tone = tone_map.get(strategy_level, "friendly and helpful")

    context = (
        f"You are a customer support agent. "
        f"The customer's name is {customer_name}. "
        f"Their frustration score is {frustration_score}/10. "
        f"They are feeling {emotion_raw}. "
        f"This is their issue number {num_tickets} about {issue_category}. "
        f"Your tone should be: {tone}. "
        f"Write a single, empathetic support reply."
    )
    return context


def _generate_with_model(prompt: str, max_new_tokens: int = 128) -> str:
    """Run BlenderBot inference."""
    try:
        import torch
        inputs = _tokenizer(
            [prompt],
            return_tensors="pt",
            truncation=True,
            max_length=128,
        )
        with torch.no_grad():
            reply_ids = _model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                num_beams=4,
                early_stopping=True,
                no_repeat_ngram_size=3,
            )
        return _tokenizer.batch_decode(reply_ids, skip_special_tokens=True)[0].strip()
    except Exception as e:
        return None


# ─── Public API ───────────────────────────────────────────────────────────────

def generate_agent_suggestion(
    customer_message: str,
    strategy_level: str,
    emotion_raw: str,
    frustration_score: float,
    customer_name: str = "the customer",
    num_tickets: int = 1,
    issue_category: str = "general",
) -> Dict:
    """
    Generate a suggested reply for the support agent.
    Returns: { reply: str, method: "model" | "template" }
    """
    _load_model()

    reply = None
    method = "template"

    if _chat_pipeline == "ready":
        context = _build_agent_context(
            strategy_level, emotion_raw, frustration_score,
            customer_name, num_tickets, issue_category,
        )
        # BlenderBot works best with conversational input
        prompt = f"{context} Customer said: {customer_message}"
        generated = _generate_with_model(prompt, max_new_tokens=100)
        if generated and len(generated) > 20:
            reply = generated
            method = "model"

    if not reply:
        reply = _template_reply(strategy_level, emotion_raw, is_agent=True)
        method = "template"

    return {
        "reply": reply,
        "method": method,
        "strategy_level": strategy_level,
        "emotion_aware": emotion_raw not in ("calm", "neutral"),
    }


def generate_chat_response(
    customer_message: str,
    conversation_history: List[Dict],
    strategy_level: str,
    emotion_raw: str,
    frustration_score: float,
) -> Dict:
    """
    Generate a customer-facing chat response.
    conversation_history: list of {role: "customer"|"agent", text: str}
    Returns: { reply: str, method: "model" | "template" }
    """
    _load_model()

    reply = None
    method = "template"

    if _chat_pipeline == "ready":
        # Build conversation context for BlenderBot
        # BlenderBot uses "  " separator between turns
        history_text = "  ".join([
            h["text"] for h in conversation_history[-4:]  # last 4 turns
        ]) if conversation_history else ""

        if history_text:
            prompt = f"{history_text}  {customer_message}"
        else:
            prompt = customer_message

        # Truncate to model limit
        prompt = prompt[-512:] if len(prompt) > 512 else prompt

        generated = _generate_with_model(prompt, max_new_tokens=120)
        if generated and len(generated) > 10:
            reply = generated
            method = "model"

    if not reply:
        reply = _template_reply(strategy_level, emotion_raw, is_agent=True)
        method = "template"

    return {
        "reply": reply,
        "method": method,
    }