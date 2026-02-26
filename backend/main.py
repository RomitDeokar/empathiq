"""
EmpathIQ — FastAPI Backend
Complete with /simulate endpoint and model preloading
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
    print("[EmpathIQ] Pre-loading ML models...")
    from models.emotion_detector import _load_model as load_emotion
    from models.sentiment_scorer import _load_model as load_sentiment
    load_emotion()
    load_sentiment()
    print("[EmpathIQ] All models ready. Server is hot.")


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
def mark_resolved(interaction_id: int, req: MarkResolvedRequest, db: Session = Depends(get_db)):
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

    emotion = detect_emotion(req.message)
    sentiment = get_sentiment_score(req.message)

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

    frustration = compute_frustration(
        history_features,
        current_emotion_weight=emotion["score_weight"],
        current_sentiment_score=sentiment["score"],
    )

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

    customer.current_frustration_score = frustration["frustration_score"]
    customer.current_churn_probability = frustration["churn_probability"]

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

DEMO_SCENARIOS = {
    "escalating": {
        "customer": {
            "id": "demo_escalating",
            "name": "Marcus Chen",
            "email": "marcus@techco.io",
            "plan_tier": "pro",
            "avatar_color": "#FF6B35",
        },
        "interactions": [
            {
                "message": "Hi, I think there might be an issue with my billing. I was charged twice this month?",
                "emotion_label": "Confused", "emotion_raw": "confused",
                "emotion_color": "#5AC8FA", "emotion_icon": "😕",
                "sentiment_score": -0.2, "sentiment_label": "Neutral",
                "frustration_score": 2.5, "issue_category": "billing",
                "resolved": False, "days_ago": 14,
            },
            {
                "message": "Still waiting on the billing refund. It's been 5 days. Can someone please look into this?",
                "emotion_label": "Annoyed", "emotion_raw": "annoyed",
                "emotion_color": "#FFCC00", "emotion_icon": "😤",
                "sentiment_score": -0.55, "sentiment_label": "Negative",
                "frustration_score": 4.8, "issue_category": "billing",
                "resolved": False, "days_ago": 9,
            },
            {
                "message": "You marked my ticket as 'resolved' but the charge is STILL on my account. This is really frustrating.",
                "emotion_label": "Angry", "emotion_raw": "angry",
                "emotion_color": "#FF6B35", "emotion_icon": "😠",
                "sentiment_score": -0.78, "sentiment_label": "Highly Negative",
                "frustration_score": 6.9, "issue_category": "billing",
                "resolved": False, "days_ago": 4,
            },
        ],
        "current_message": "Still not fixed. 4th time contacting you about the same billing issue.",
        "expected_score": 8.4,
        "expected_urgency": "CRITICAL",
    },
    "first_timer": {
        "customer": {
            "id": "demo_first_timer",
            "name": "Priya Sharma",
            "email": "priya@startup.com",
            "plan_tier": "standard",
            "avatar_color": "#34C759",
        },
        "interactions": [],
        "current_message": "Hello! I just signed up yesterday and I'm having a bit of trouble finding where to connect my Slack workspace. Could you help me out?",
        "expected_score": 2.1,
        "expected_urgency": "LOW",
    },
    "silent_churner": {
        "customer": {
            "id": "demo_silent_churner",
            "name": "Jordan Taylor",
            "email": "jtaylor@bigcorp.com",
            "plan_tier": "enterprise",
            "avatar_color": "#AF52DE",
        },
        "interactions": [
            {
                "message": "Your export feature is completely broken. I've lost 3 hours of work because of this. This is unacceptable for an enterprise product.",
                "emotion_label": "Angry", "emotion_raw": "angry",
                "emotion_color": "#FF6B35", "emotion_icon": "😠",
                "sentiment_score": -0.82, "sentiment_label": "Highly Negative",
                "frustration_score": 7.2, "issue_category": "product_bug",
                "resolved": False, "days_ago": 22,
            },
            {
                "message": "Still broken. I don't even know why I bother filing tickets.",
                "emotion_label": "Defeated", "emotion_raw": "defeated",
                "emotion_color": "#AF52DE", "emotion_icon": "😔",
                "sentiment_score": -0.71, "sentiment_label": "Highly Negative",
                "frustration_score": 7.8, "issue_category": "product_bug",
                "resolved": False, "days_ago": 20,
            },
        ],
        "current_message": "I need to talk to someone about our account.",
        "expected_score": 9.1,
        "expected_urgency": "EMERGENCY",
    },
}


@app.post("/simulate")
def simulate_scenario(payload: dict, db: Session = Depends(get_db)):
    """
    Load a demo scenario end-to-end.
    Body: { "scenario_name": "escalating" | "first_timer" | "silent_churner" }
    Returns full analysis as if the scenario just happened.
    """
    scenario_name = payload.get("scenario_name")
    if not scenario_name or scenario_name not in DEMO_SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario. Valid: {list(DEMO_SCENARIOS.keys())}"
        )

    scenario = DEMO_SCENARIOS[scenario_name]
    cdata = scenario["customer"]

    # Upsert customer
    customer = db.query(Customer).filter(Customer.id == cdata["id"]).first()
    if not customer:
        customer = Customer(
            id=cdata["id"],
            name=cdata["name"],
            email=cdata["email"],
            plan_tier=cdata["plan_tier"],
            avatar_color=cdata["avatar_color"],
            current_frustration_score=0.0,
            current_churn_probability=0.0,
        )
        db.add(customer)
        db.commit()
    else:
        # Clear old interactions so demo is always fresh
        db.query(Interaction).filter(Interaction.customer_id == cdata["id"]).delete()
        db.query(StrategyLog).filter(StrategyLog.customer_id == cdata["id"]).delete()
        db.commit()

    # Seed historical interactions
    now = datetime.utcnow()
    for idata in scenario["interactions"]:
        ts = now - timedelta(days=idata["days_ago"])
        interaction = Interaction(
            customer_id=cdata["id"],
            timestamp=ts,
            message=idata["message"],
            emotion_label=idata["emotion_label"],
            emotion_raw=idata["emotion_raw"],
            emotion_color=idata["emotion_color"],
            emotion_icon=idata["emotion_icon"],
            sentiment_score=idata["sentiment_score"],
            sentiment_label=idata["sentiment_label"],
            frustration_score=idata["frustration_score"],
            issue_category=idata["issue_category"],
            resolved=idata["resolved"],
            days_ago=idata["days_ago"],
        )
        db.add(interaction)
    db.commit()

    # Now run the current message through the full pipeline
    current_msg = scenario["current_message"]

    emotion = detect_emotion(current_msg)
    sentiment = get_sentiment_score(current_msg)

    past_interactions = (
        db.query(Interaction)
        .filter(Interaction.customer_id == cdata["id"])
        .order_by(Interaction.timestamp.desc())
        .all()
    )

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

    frustration = compute_frustration(
        history_features,
        current_emotion_weight=emotion["score_weight"],
        current_sentiment_score=sentiment["score"],
    )

    strategy = recommend_strategy(
        frustration_score=frustration["frustration_score"],
        emotion_raw=emotion["raw_emotion"],
        trajectory=frustration["trajectory"],
        churn_probability=frustration["churn_probability"],
        flags=frustration["flags"],
        num_past_tickets=len(past_interactions),
        plan_tier=customer.plan_tier,
        unresolved_count=frustration.get("unresolved_count", 0),
    )

    # Persist the current message too
    new_interaction = Interaction(
        customer_id=cdata["id"],
        message=current_msg,
        emotion_label=emotion["label"],
        emotion_raw=emotion["raw_emotion"],
        emotion_color=emotion["color"],
        emotion_icon=emotion["icon"],
        sentiment_score=sentiment["score"],
        sentiment_label=sentiment["label"],
        frustration_score=frustration["frustration_score"],
        issue_category=scenario["interactions"][-1]["issue_category"] if scenario["interactions"] else "general",
        resolved=False,
        days_ago=0,
    )
    db.add(new_interaction)

    customer.current_frustration_score = frustration["frustration_score"]
    customer.current_churn_probability = frustration["churn_probability"]

    strategy_log = StrategyLog(
        customer_id=cdata["id"],
        strategy_level=strategy["level"],
        strategy_label=strategy["label"],
        frustration_score=frustration["frustration_score"],
        churn_probability=frustration["churn_probability"],
        flags=json.dumps(frustration["flags"]),
    )
    db.add(strategy_log)
    db.commit()

    # Return full picture for frontend to render
    all_interactions = (
        db.query(Interaction)
        .filter(Interaction.customer_id == cdata["id"])
        .order_by(Interaction.timestamp.asc())
        .all()
    )

    return {
        "scenario_name": scenario_name,
        "customer": _customer_to_out(customer, db),
        "history": [
            {
                "id": i.id,
                "customer_id": i.customer_id,
                "timestamp": i.timestamp.isoformat(),
                "message": i.message,
                "emotion_label": i.emotion_label,
                "emotion_raw": i.emotion_raw,
                "emotion_color": i.emotion_color,
                "emotion_icon": i.emotion_icon,
                "sentiment_score": i.sentiment_score,
                "sentiment_label": i.sentiment_label,
                "frustration_score": i.frustration_score,
                "issue_category": i.issue_category,
                "resolved": i.resolved,
            }
            for i in all_interactions
        ],
        "analysis": {
            "customer_id": cdata["id"],
            "emotion": emotion,
            "sentiment": sentiment,
            "frustration": frustration,
            "strategy": strategy,
            "timestamp": datetime.utcnow().isoformat(),
        },
        "expected_score": scenario.get("expected_score"),
        "expected_urgency": scenario.get("expected_urgency"),
    }


@app.get("/simulate/scenarios")
def list_scenarios():
    return {
        "scenarios": [
            {
                "name": "escalating",
                "label": "⚡ The Escalator",
                "description": "4th billing ticket, language sharpening",
                "expected_score": 8.4,
                "expected_urgency": "CRITICAL",
            },
            {
                "name": "first_timer",
                "label": "👋 First Timer",
                "description": "New user, confused but calm",
                "expected_score": 2.1,
                "expected_urgency": "LOW",
            },
            {
                "name": "silent_churner",
                "label": "🔇 Silent Churner",
                "description": "Went quiet 18 days, cold short message",
                "expected_score": 9.1,
                "expected_urgency": "EMERGENCY",
            },
        ]
    }


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
        current_frustration_score=round(customer.current_frustration_score or 0.0, 1),
        current_churn_probability=round(customer.current_churn_probability or 0.0, 3),
        interaction_count=count,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)