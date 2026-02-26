"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime


class AnalyzeRequest(BaseModel):
    customer_id: str
    message: str
    issue_category: Optional[str] = "general"
    resolved: Optional[bool] = False


class MarkResolvedRequest(BaseModel):
    interaction_id: int
    resolved: bool


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
    emotion_label: Optional[str] = None
    emotion_raw: Optional[str] = None
    emotion_color: Optional[str] = None
    emotion_icon: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    frustration_score: Optional[float] = None
    issue_category: Optional[str] = "general"
    resolved: bool = False

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


class CreateCustomerRequest(BaseModel):
    name: str
    email: str
    plan_tier: Optional[str] = "standard"
    avatar_color: Optional[str] = "#5AC8FA"

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("email")
    @classmethod
    def email_not_empty(cls, v: str) -> str:
        v = v.strip().lower()
        if not v or "@" not in v:
            raise ValueError("Valid email required")
        return v

    @field_validator("plan_tier")
    @classmethod
    def valid_tier(cls, v: str) -> str:
        allowed = {"free", "standard", "pro", "enterprise"}
        if v not in allowed:
            return "standard"
        return v
