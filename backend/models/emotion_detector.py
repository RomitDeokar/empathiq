"""
Emotion Detection Module
Uses cardiffnlp/twitter-roberta-base-emotion with keyword fallback for speed.
"""
import re
from typing import Dict, Tuple

# Try to load transformer model, fallback to keyword-based for demo speed
_emotion_pipeline = None

def _load_model():
    global _emotion_pipeline
    if _emotion_pipeline is None:
        try:
            from transformers import pipeline
            _emotion_pipeline = pipeline(
                "text-classification",
                model="cardiffnlp/twitter-roberta-base-emotion",
                return_all_scores=True,
                truncation=True,
                max_length=128
            )
            print("[EmotionDetector] Transformer model loaded.")
        except Exception as e:
            print(f"[EmotionDetector] Transformer load failed ({e}), using keyword fallback.")
            _emotion_pipeline = "fallback"


FRUSTRATION_KEYWORDS = {
    "furious":    ["unacceptable", "ridiculous", "scam", "fraud", "sue", "lawyer", "cancel immediately", "pathetic", "disgraceful"],
    "angry":      ["still broken", "still not fixed", "fourth time", "third time", "useless", "incompetent", "joke", "waste of money", "furious", "angry", "outraged", "terrible", "worst"],
    "escalating": ["again?!", "seriously", "already told", "how many times", "not resolved", "still waiting", "completely unacceptable", "this is ridiculous"],
    "annoyed":    ["frustrated", "annoyed", "why is this", "still not", "this is taking", "slow", "not working again", "come on"],
    "confused":   ["not sure", "confused", "don't understand", "what does", "can you explain", "help me understand", "unclear", "what should"],
    "defeated":   ["give up", "forget it", "never mind", "whatever", "done with this", "pointless", "doesn't matter anymore"],
    "calm":       ["please", "thank you", "could you", "would it be possible", "appreciate", "happy to provide"],
}

EMOTION_MAP = {
    "furious":    {"label": "Furious",    "color": "#FF2D55", "icon": "🔥", "score_weight": 10.0},
    "angry":      {"label": "Angry",      "color": "#FF6B35", "icon": "😠", "score_weight": 8.5},
    "escalating": {"label": "Escalating", "color": "#FF9500", "icon": "⚡", "score_weight": 7.5},
    "annoyed":    {"label": "Annoyed",    "color": "#FFCC00", "icon": "😤", "score_weight": 6.0},
    "confused":   {"label": "Confused",   "color": "#5AC8FA", "icon": "😕", "score_weight": 3.5},
    "defeated":   {"label": "Defeated",   "color": "#AF52DE", "icon": "😔", "score_weight": 7.0},
    "calm":       {"label": "Calm",       "color": "#34C759", "icon": "😊", "score_weight": 1.0},
    "neutral":    {"label": "Neutral",    "color": "#8E8E93", "icon": "😐", "score_weight": 2.0},
}


def _keyword_detect(text: str) -> Tuple[str, float]:
    text_lower = text.lower()
    
    # Check punctuation signals
    exclamations = text.count("!")
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    
    scores = {}
    for emotion, keywords in FRUSTRATION_KEYWORDS.items():
        matches = sum(1 for kw in keywords if kw in text_lower)
        scores[emotion] = matches

    # Boost angry/escalating for high caps or exclamations
    if caps_ratio > 0.3:
        scores["angry"] = scores.get("angry", 0) + 2
    if exclamations >= 2:
        scores["escalating"] = scores.get("escalating", 0) + 1

    # Very short cold message (defeated or escalating)
    words = text.split()
    if len(words) <= 5 and not any(kw in text_lower for kw in FRUSTRATION_KEYWORDS["calm"]):
        scores["escalating"] = scores.get("escalating", 0) + 1

    best_emotion = max(scores, key=lambda k: scores[k]) if max(scores.values()) > 0 else "neutral"
    confidence = min(0.95, 0.55 + scores.get(best_emotion, 0) * 0.1)
    
    return best_emotion, confidence


def detect_emotion(text: str) -> Dict:
    """
    Detect emotion from text.
    Returns: {label, color, icon, confidence, raw_emotion, score_weight}
    """
    _load_model()
    
    raw_emotion = "neutral"
    confidence = 0.7

    if _emotion_pipeline and _emotion_pipeline != "fallback":
        try:
            results = _emotion_pipeline(text[:512])
            top = max(results[0], key=lambda x: x["score"])
            confidence = top["score"]
            transformer_label = top["label"].lower()
            
            # Map transformer labels to our emotions
            label_map = {
                "anger":    "angry",
                "joy":      "calm",
                "optimism": "calm",
                "sadness":  "defeated",
                "fear":     "confused",
                "disgust":  "angry",
                "surprise": "confused",
            }
            raw_emotion = label_map.get(transformer_label, "neutral")

            # Keyword override for frustration signals transformer might miss
            kw_emotion, kw_conf = _keyword_detect(text)
            kw_weight = EMOTION_MAP.get(kw_emotion, {}).get("score_weight", 0)
            tr_weight = EMOTION_MAP.get(raw_emotion, {}).get("score_weight", 0)
            
            if kw_weight > tr_weight and kw_conf > 0.6:
                raw_emotion = kw_emotion
                confidence = kw_conf

        except Exception:
            raw_emotion, confidence = _keyword_detect(text)
    else:
        raw_emotion, confidence = _keyword_detect(text)

    emotion_data = EMOTION_MAP.get(raw_emotion, EMOTION_MAP["neutral"])
    
    return {
        "raw_emotion": raw_emotion,
        "label": emotion_data["label"],
        "color": emotion_data["color"],
        "icon": emotion_data["icon"],
        "confidence": round(confidence, 3),
        "score_weight": emotion_data["score_weight"],
    }
