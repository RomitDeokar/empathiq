"""
EmpathIQ — FastAPI Backend
Main application — all bugs fixed, demo mode removed
"""
import json
import sys
import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Ensure the backend directory is in the path for local imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db, get_db, Customer, Interaction, StrategyLog
from schemas import (
    AnalyzeRequest, AnalyzeResponse,
    InteractionOut, CustomerOut,
    CreateCustomerRequest, MarkResolvedRequest,
)
from models.emotion_detector import detect_emotion
from models.sentiment_scorer import get_sentiment_score
from models.frustration_lstm import compute_frustration
from models.strategy_engine import recommend_strategy

app = FastAPI(
    title="EmpathIQ API",
    description="Emotional Context Layer for Customer Support",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    print("[EmpathIQ] Database initialized.")


# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "EmpathIQ API is running", "version": "2.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ─── Customer Endpoints ──────────────────────────────────────────────────────

@app.post("/customers", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(req: CreateCustomerRequest, db: Session = Depends(get_db)):
    # Check for duplicate email
    existing_email = db.query(Customer).filter(Customer.email == req.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A customer with email '{req.email}' already exists.",
        )

    customer = Customer(
        id=str(uuid.uuid4()),
        name=req.name,
        email=req.email,
        plan_tier=req.plan_tier or "standard",
        avatar_color=req.avatar_color or "#5AC8FA",
        current_frustration_score=0.0,
        current_churn_probability=0.0,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return _customer_to_out(customer, db)


@app.get("/customers", response_model=List[CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    results = [_customer_to_out(c, db) for c in customers]
    results.sort(key=lambda x: x.current_frustration_score, reverse=True)
    return results


@app.get("/customers/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = _get_customer_or_404(customer_id, db)
    return _customer_to_out(customer, db)


@app.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = _get_customer_or_404(customer_id, db)
    db.delete(customer)
    db.commit()


@app.get("/customers/{customer_id}/history", response_model=List[InteractionOut])
def get_history(customer_id: str, db: Session = Depends(get_db)):
    _get_customer_or_404(customer_id, db)
    interactions = (
        db.query(Interaction)
        .filter(Interaction.customer_id == customer_id)
        .order_by(Interaction.timestamp.asc())
        .all()
    )
    return interactions


@app.patch("/interactions/{interaction_id}/resolve", response_model=InteractionOut)
def mark_resolved(
    interaction_id: int,
    req: MarkResolvedRequest,
    db: Session = Depends(get_db),
):
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    interaction.resolved = req.resolved
    db.commit()
    db.refresh(interaction)
    return interaction


# ─── Core Analysis Endpoint ──────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_message(req: AnalyzeRequest, db: Session = Depends(get_db)):
    customer = _get_customer_or_404(req.customer_id, db)

    # 1. Emotion Detection
    emotion = detect_emotion(req.message)

    # 2. Sentiment Scoring
    sentiment = get_sentiment_score(req.message)

    # 3. Build interaction history features for frustration model
    past_interactions = (
        db.query(Interaction)
        .filter(Interaction.customer_id == req.customer_id)
        .order_by(Interaction.timestamp.desc())
        .all()
    )

    now = datetime.utcnow()
    history_features = []
    for interaction in past_interactions:
        days_ago = max(0, (now - interaction.timestamp).days)
        history_features.append({
            "sentiment_score": interaction.sentiment_score or 0.0,
            "emotion_weight": _get_emotion_weight(interaction.emotion_raw),
            "resolved": interaction.resolved or False,
            "issue_category": interaction.issue_category or "general",
            "days_ago": days_ago,
        })

    # 4. Frustration Score
    frustration = compute_frustration(
        history_features,
        current_emotion_weight=emotion["score_weight"],
        current_sentiment_score=sentiment["score"],
    )

    # 5. Strategy Recommendation
    strategy = recommend_strategy(
        frustration_score=frustration["frustration_score"],
        emotion_raw=emotion["raw_emotion"],
        trajectory=frustration["trajectory"],
        churn_probability=frustration["churn_probability"],
        flags=frustration["flags"],
        num_past_tickets=len(past_interactions),
        plan_tier=customer.plan_tier,
        unresolved_count=frustration["unresolved_count"],
    )

    # 6. Persist interaction to DB
    new_interaction = Interaction(
        customer_id=req.customer_id,
        message=req.message,
        emotion_label=emotion["label"],
        emotion_raw=emotion["raw_emotion"],
        emotion_color=emotion["color"],
        emotion_icon=emotion["icon"],
        sentiment_score=sentiment["score"],
        sentiment_label=sentiment["label"],
        frustration_score=frustration["frustration_score"],
        issue_category=req.issue_category or "general",
        resolved=req.resolved or False,
        days_ago=0,
    )
    db.add(new_interaction)

    # Update customer cached scores
    customer.current_frustration_score = frustration["frustration_score"]
    customer.current_churn_probability = frustration["churn_probability"]

    # Log strategy decision
    strategy_log = StrategyLog(
        customer_id=req.customer_id,
        strategy_level=strategy["level"],
        strategy_label=strategy["label"],
        frustration_score=frustration["frustration_score"],
        churn_probability=frustration["churn_probability"],
        flags=json.dumps(frustration["flags"]),
    )
    db.add(strategy_log)
    db.commit()

    return AnalyzeResponse(
        customer_id=req.customer_id,
        emotion=emotion,
        sentiment=sentiment,
        frustration=frustration,
        strategy=strategy,
        timestamp=datetime.utcnow().isoformat(),
    )


# ─── Dashboard Summary ────────────────────────────────────────────────────────

@app.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    results = []
    for c in customers:
        count = db.query(Interaction).filter(Interaction.customer_id == c.id).count()
        unresolved = (
            db.query(Interaction)
            .filter(Interaction.customer_id == c.id, Interaction.resolved == False)
            .count()
        )
        results.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "plan_tier": c.plan_tier,
            "avatar_color": c.avatar_color,
            "frustration_score": round(c.current_frustration_score or 0.0, 1),
            "churn_probability": round(c.current_churn_probability or 0.0, 3),
            "interaction_count": count,
            "unresolved_count": unresolved,
        })
    results.sort(key=lambda x: x["frustration_score"], reverse=True)
    return {"customers": results, "total": len(results)}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_customer_or_404(customer_id: str, db: Session) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer '{customer_id}' not found.",
        )
    return customer


def _get_emotion_weight(raw_emotion: Optional[str]) -> float:
    WEIGHTS = {
        "furious": 10.0,
        "angry": 8.5,
        "escalating": 7.5,
        "annoyed": 6.0,
        "confused": 3.5,
        "defeated": 7.0,
        "calm": 1.0,
        "neutral": 2.0,
    }
    return WEIGHTS.get(raw_emotion or "neutral", 2.0)


def _customer_to_out(customer: Customer, db: Session) -> CustomerOut:
    count = db.query(Interaction).filter(Interaction.customer_id == customer.id).count()
    return CustomerOut(
        id=customer.id,
        name=customer.name,
        email=customer.email,
        plan_tier=customer.plan_tier,
        avatar_color=customer.avatar_color,
        current_frustration_score=round(customer.current_frustration_score or 0.0, 1),
        current_churn_probability=round(customer.current_churn_probability or 0.0, 3),
        interaction_count=count,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
