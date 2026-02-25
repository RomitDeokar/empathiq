"""
EmpathIQ — FastAPI Backend
Main application entry point
"""
import json
import sys
import os
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db, get_db, Customer, Interaction, StrategyLog
from schemas import (
    AnalyzeRequest, AnalyzeResponse,
    InteractionOut, CustomerOut,
    SimulateRequest, CreateCustomerRequest
)
from models.emotion_detector import detect_emotion
from models.sentiment_scorer import get_sentiment_score
from models.frustration_lstm import compute_frustration
from models.strategy_engine import recommend_strategy

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from scenarios.demo_scenarios import get_scenario, list_scenarios

app = FastAPI(
    title="EmpathIQ API",
    description="Emotional Context Layer for Customer Support",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    print("[EmpathIQ] Database initialized.")


@app.get("/")
def root():
    return {"message": "EmpathIQ API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ─── Customer Endpoints ──────────────────────────────────────────────────────

@app.post("/customers", response_model=CustomerOut)
def create_customer(req: CreateCustomerRequest, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.id == req.id).first()
    if existing:
        return _customer_to_out(existing, db)
    
    customer = Customer(
        id=req.id,
        name=req.name,
        email=req.email,
        plan_tier=req.plan_tier,
        avatar_color=req.avatar_color,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return _customer_to_out(customer, db)


@app.get("/customers", response_model=List[CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    results = [_customer_to_out(c, db) for c in customers]
    # Sort by frustration score descending
    results.sort(key=lambda x: x.current_frustration_score, reverse=True)
    return results


@app.get("/customers/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return _customer_to_out(customer, db)


@app.get("/customers/{customer_id}/history", response_model=List[InteractionOut])
def get_history(customer_id: str, db: Session = Depends(get_db)):
    interactions = (
        db.query(Interaction)
        .filter(Interaction.customer_id == customer_id)
        .order_by(Interaction.timestamp)
        .all()
    )
    return interactions


# ─── Core Analysis Endpoint ──────────────────────────────────────────────────

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_message(req: AnalyzeRequest, db: Session = Depends(get_db)):
    # Ensure customer exists
    customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer '{req.customer_id}' not found. Create customer first.")

    # 1. Emotion Detection
    emotion = detect_emotion(req.message)

    # 2. Sentiment Scoring
    sentiment = get_sentiment_score(req.message)

    # 3. Build interaction history for frustration model
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

    # 6. Persist interaction
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
        issue_category=req.issue_category,
        resolved=req.resolved,
        days_ago=0,
    )
    db.add(new_interaction)

    # Update customer scores
    customer.current_frustration_score = frustration["frustration_score"]
    customer.current_churn_probability = frustration["churn_probability"]

    # Log strategy
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


# ─── Simulate Endpoint ────────────────────────────────────────────────────────

@app.post("/simulate")
def simulate_scenario(req: SimulateRequest, db: Session = Depends(get_db)):
    """Load a full demo scenario into the database and return the final analysis."""
    scenario = get_scenario(req.scenario_name)
    if not scenario:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario '{req.scenario_name}'. Available: {list_scenarios()}"
        )

    customer_data = scenario["customer"]
    
    # Upsert customer
    customer = db.query(Customer).filter(Customer.id == customer_data["id"]).first()
    if customer:
        # Clear old interactions for clean demo
        db.query(Interaction).filter(Interaction.customer_id == customer_data["id"]).delete()
        db.query(StrategyLog).filter(StrategyLog.customer_id == customer_data["id"]).delete()
    else:
        customer = Customer(
            id=customer_data["id"],
            name=customer_data["name"],
            email=customer_data["email"],
            plan_tier=customer_data.get("plan_tier", "standard"),
            avatar_color=customer_data.get("avatar_color", "#5AC8FA"),
        )
        db.add(customer)
    db.commit()

    # Load historical interactions
    now = datetime.utcnow()
    for i, interaction_data in enumerate(scenario.get("interactions", [])):
        days_ago = interaction_data.get("days_ago", 0)
        timestamp = now - __import__('datetime').timedelta(days=days_ago)
        
        interaction = Interaction(
            customer_id=customer_data["id"],
            timestamp=timestamp,
            message=interaction_data["message"],
            emotion_label=interaction_data["emotion_label"],
            emotion_raw=interaction_data["emotion_raw"],
            emotion_color=interaction_data["emotion_color"],
            emotion_icon=interaction_data["emotion_icon"],
            sentiment_score=interaction_data["sentiment_score"],
            sentiment_label=interaction_data["sentiment_label"],
            frustration_score=interaction_data["frustration_score"],
            issue_category=interaction_data.get("issue_category", "general"),
            resolved=interaction_data.get("resolved", False),
            days_ago=days_ago,
        )
        db.add(interaction)
    
    db.commit()

    # Now analyze the current message
    analyze_req = AnalyzeRequest(
        customer_id=customer_data["id"],
        message=scenario["current_message"],
        issue_category=scenario.get("interactions", [{}])[-1].get("issue_category", "general") if scenario.get("interactions") else "general",
    )
    
    return analyze_message(analyze_req, db)


@app.get("/scenarios")
def get_scenarios():
    return {"scenarios": list_scenarios()}


@app.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    customers = db.query(Customer).all()
    results = []
    for c in customers:
        count = db.query(Interaction).filter(Interaction.customer_id == c.id).count()
        results.append({
            "id": c.id,
            "name": c.name,
            "plan_tier": c.plan_tier,
            "avatar_color": c.avatar_color,
            "frustration_score": c.current_frustration_score,
            "churn_probability": c.current_churn_probability,
            "interaction_count": count,
        })
    results.sort(key=lambda x: x["frustration_score"], reverse=True)
    return {"customers": results, "total": len(results)}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_emotion_weight(raw_emotion: Optional[str]) -> float:
    WEIGHTS = {
        "furious": 10.0, "angry": 8.5, "escalating": 7.5,
        "annoyed": 6.0, "confused": 3.5, "defeated": 7.0,
        "calm": 1.0, "neutral": 2.0,
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
        current_frustration_score=customer.current_frustration_score,
        current_churn_probability=customer.current_churn_probability,
        interaction_count=count,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
