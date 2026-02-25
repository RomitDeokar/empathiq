"""
Frustration Score Engine
Combines emotional trajectory + interaction history into a 0-10 frustration score.
Uses a weighted sequential model over past interactions.
Designed to be fast (no actual LSTM inference needed for demo — uses analytical model).
"""
from typing import List, Dict, Optional
import math


class FrustrationScorer:
    """
    Analytical frustration scoring model that replicates LSTM-style temporal reasoning.
    Each interaction is a vector: [sentiment_score, emotion_weight, resolution_penalty]
    The score compounds over time with recency weighting.
    """

    # How much each unresolved ticket adds to base frustration
    UNRESOLVED_PENALTY = 0.8
    
    # Recency decay — more recent interactions matter more
    RECENCY_DECAY = 0.85
    
    # Repeat issue multiplier
    REPEAT_ISSUE_BONUS = 1.4
    
    # Silent period signal (came back after going quiet = high risk)
    SILENT_RETURN_BONUS = 1.6

    def compute_score(
        self,
        interactions: List[Dict],
        current_emotion_weight: float,
        current_sentiment_score: float,
    ) -> Dict:
        """
        interactions: list of past interaction dicts with keys:
            - sentiment_score: float (-1 to +1)
            - emotion_weight: float (from EMOTION_MAP score_weight)
            - resolved: bool
            - issue_category: str
            - days_ago: int
        current_emotion_weight: weight of current message emotion
        current_sentiment_score: sentiment of current message

        Returns: {frustration_score, trajectory, churn_probability, flags}
        """
        
        if not interactions and current_emotion_weight < 3:
            # Brand new, calm customer
            base = max(0.5, (current_emotion_weight / 10.0) * 3)
            return {
                "frustration_score": round(base, 1),
                "trajectory": "stable",
                "churn_probability": round(base / 10.0 * 0.3, 2),
                "flags": [],
                "interaction_count": 0,
            }

        # Build score from history
        total_weight = 0.0
        total_score = 0.0
        
        # Sort by recency (most recent first)
        sorted_interactions = sorted(interactions, key=lambda x: x.get("days_ago", 0))
        
        flags = []
        repeat_issues = {}
        unresolved_count = 0
        silent_return = False

        for i, interaction in enumerate(sorted_interactions):
            recency_weight = self.RECENCY_DECAY ** i
            
            sentiment = interaction.get("sentiment_score", 0.0)
            emotion_w = interaction.get("emotion_weight", 2.0)
            resolved = interaction.get("resolved", True)
            category = interaction.get("issue_category", "general")
            days_ago = interaction.get("days_ago", 0)

            # Contribution from this interaction
            # Normalize emotion weight to 0-1 range (max is 10)
            normalized_emotion = emotion_w / 10.0
            # Sentiment contribution: negative = bad
            sentiment_contrib = max(0, -sentiment)
            
            interaction_score = (normalized_emotion * 0.5 + sentiment_contrib * 0.5) * 10
            
            if not resolved:
                interaction_score *= (1 + self.UNRESOLVED_PENALTY)
                unresolved_count += 1
            
            # Track repeat issues
            repeat_issues[category] = repeat_issues.get(category, 0) + 1
            if repeat_issues[category] >= 2:
                interaction_score *= self.REPEAT_ISSUE_BONUS

            # Silent return detection: if days_ago gap is large
            if i > 0 and days_ago > 14 and sorted_interactions[i-1].get("days_ago", 0) < 3:
                silent_return = True
                interaction_score *= self.SILENT_RETURN_BONUS

            total_score += interaction_score * recency_weight
            total_weight += recency_weight

        # Current message contribution (highest weight)
        current_contrib = (
            (current_emotion_weight / 10.0) * 0.6 +
            max(0, -current_sentiment_score) * 0.4
        ) * 10
        
        if len(interactions) > 0:
            total_score += current_contrib * 1.5
            total_weight += 1.5
        else:
            total_score = current_contrib
            total_weight = 1.0

        raw_score = (total_score / total_weight) if total_weight > 0 else current_contrib
        
        # Apply modifiers
        if unresolved_count >= 2:
            raw_score *= 1.2
            flags.append("multiple_unresolved")
        
        repeat_categories = [cat for cat, count in repeat_issues.items() if count >= 2]
        if repeat_categories:
            raw_score *= 1.15
            flags.append("repeat_issue_pattern")
        
        if silent_return:
            flags.append("silent_return_signal")
        
        if len(interactions) >= 4:
            flags.append("high_contact_frequency")
        
        # Clamp to 0-10
        frustration_score = min(10.0, max(0.0, raw_score))
        frustration_score = round(frustration_score, 1)

        # Determine trajectory
        if len(interactions) >= 2:
            recent = sorted_interactions[:2]
            recent_avg = sum(i.get("emotion_weight", 2) for i in recent) / 2
            older = sorted_interactions[2:] if len(sorted_interactions) > 2 else sorted_interactions
            older_avg = sum(i.get("emotion_weight", 2) for i in older) / max(len(older), 1)
            
            if recent_avg > older_avg + 1.5:
                trajectory = "escalating"
            elif recent_avg < older_avg - 1.5:
                trajectory = "improving"
            else:
                trajectory = "stable"
        else:
            if current_emotion_weight >= 7:
                trajectory = "escalating"
            elif current_emotion_weight <= 2:
                trajectory = "stable"
            else:
                trajectory = "stable"

        # Churn probability
        churn_base = frustration_score / 10.0
        if "silent_return_signal" in flags:
            churn_base = min(1.0, churn_base * 1.4)
        if "multiple_unresolved" in flags:
            churn_base = min(1.0, churn_base * 1.2)
        churn_probability = round(min(0.97, churn_base * 0.9 + 0.05), 2)

        return {
            "frustration_score": frustration_score,
            "trajectory": trajectory,
            "churn_probability": churn_probability,
            "flags": flags,
            "interaction_count": len(interactions),
            "unresolved_count": unresolved_count,
            "repeat_categories": repeat_categories,
        }


# Singleton
_scorer = FrustrationScorer()

def compute_frustration(
    interactions: List[Dict],
    current_emotion_weight: float,
    current_sentiment_score: float,
) -> Dict:
    return _scorer.compute_score(interactions, current_emotion_weight, current_sentiment_score)
