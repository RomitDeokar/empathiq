"""
Sentiment Scoring Module
Fine-grained negative/positive score from -1.0 to +1.0
"""
import re
from typing import Dict

_sentiment_pipeline = None

def _load_model():
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        try:
            from transformers import pipeline
            _sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                truncation=True,
                max_length=128
            )
            print("[SentimentScorer] DistilBERT loaded.")
        except Exception as e:
            print(f"[SentimentScorer] Model load failed ({e}), using heuristic.")
            _sentiment_pipeline = "fallback"


NEGATIVE_INTENSIFIERS = [
    "very", "extremely", "completely", "absolutely", "totally", "utterly",
    "so", "really", "incredibly", "unbelievably", "terribly"
]

NEGATIVE_WORDS = [
    "bad", "terrible", "awful", "horrible", "useless", "broken", "failed",
    "wrong", "error", "issue", "problem", "bug", "frustrated", "angry",
    "disappointed", "unacceptable", "ridiculous", "incompetent", "pathetic",
    "scam", "fraud", "lie", "lied", "dishonest", "worst", "never", "can't",
    "cannot", "won't", "not working", "still not", "again", "another"
]

POSITIVE_WORDS = [
    "great", "excellent", "perfect", "wonderful", "amazing", "fantastic",
    "thank", "thanks", "appreciate", "helpful", "resolved", "fixed", "works",
    "happy", "satisfied", "good", "nice"
]


def _heuristic_sentiment(text: str) -> float:
    text_lower = text.lower()
    words = text_lower.split()
    
    neg_count = sum(1 for w in NEGATIVE_WORDS if w in text_lower)
    pos_count = sum(1 for w in POSITIVE_WORDS if w in text_lower)
    intensifier_count = sum(1 for w in NEGATIVE_INTENSIFIERS if w in words)
    
    # Punctuation signals
    exclamations = min(text.count("!"), 5)
    question_marks = text.count("?")
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text.replace(" ", "")), 1)
    
    score = 0.0
    score -= neg_count * 0.15
    score += pos_count * 0.1
    score -= intensifier_count * 0.1
    score -= exclamations * 0.05
    score -= caps_ratio * 0.3
    
    # Very short, curt messages lean negative
    if len(text.split()) <= 4:
        score -= 0.2

    return max(-1.0, min(1.0, score))


def get_sentiment_score(text: str) -> Dict:
    """
    Returns: {score: float (-1 to +1), label: str, magnitude: float}
    """
    _load_model()
    
    if _sentiment_pipeline and _sentiment_pipeline != "fallback":
        try:
            result = _sentiment_pipeline(text[:512])
            raw_score = result[0]["score"]
            if result[0]["label"] == "NEGATIVE":
                score = -raw_score
            else:
                score = raw_score
        except Exception:
            score = _heuristic_sentiment(text)
    else:
        score = _heuristic_sentiment(text)

    if score >= 0.3:
        label = "Positive"
    elif score >= -0.2:
        label = "Neutral"
    elif score >= -0.6:
        label = "Negative"
    else:
        label = "Highly Negative"

    return {
        "score": round(score, 3),
        "label": label,
        "magnitude": round(abs(score), 3),
    }
