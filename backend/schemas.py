"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class AnalyzeRequest(BaseModel):
    customer_id: str
    message: str
    issue_category: Optional[str] = "general"
    resolved: Optional[bool] = False


class EmotionResult(BaseModel):
    raw_emotion: str
    label: str
    color: str
    icon: str
    confidence: float
    score_weight: float


class SentimentResult(BaseModel):
    score: float
    label: str
    magnitude: float


class FrustrationResult(BaseModel):
    frustration_score: float
    trajectory: str
    churn_probability: float
    flags: List[str]
    interaction_count: int
    unresolved_count: int
    repeat_categories: List[str]


class StrategyResult(BaseModel):
    id: int
    level: str
    label: str
    color: str
    bg: str
    border: str
    urgency: str
    icon: str
    actions: List[str]
    tone_guidance: str
    skip_greeting: bool
    escalate_human: bool
    offer_credit: bool
    flag_churn_risk: bool
    reasoning: List[str]
    effective_score: float
    plan_tier: str


class AnalyzeResponse(BaseModel):
    customer_id: str
    emotion: EmotionResult
    sentiment: SentimentResult
    frustration: FrustrationResult
    strategy: StrategyResult
    timestamp: str


class InteractionOut(BaseModel):
    id: int
    customer_id: str
    timestamp: datetime
    message: str
    emotion_label: str
    emotion_raw: str
    emotion_color: str
    emotion_icon: str
    sentiment_score: float
    sentiment_label: str
    frustration_score: float
    issue_category: str
    resolved: bool

    class Config:
        from_attributes = True


class CustomerOut(BaseModel):
    id: str
    name: str
    email: str
    plan_tier: str
    avatar_color: str
    current_frustration_score: float
    current_churn_probability: float
    interaction_count: int

    class Config:
        from_attributes = True


class SimulateRequest(BaseModel):
    scenario_name: str  # "escalating", "first_timer", "silent_churner"


class CreateCustomerRequest(BaseModel):
    id: str
    name: str
    email: str
    plan_tier: Optional[str] = "standard"
    avatar_color: Optional[str] = "#5AC8FA"
