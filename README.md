# EmpathIQ 🧠
### Emotional Context Layer for Customer Support

> *"Support systems are emotionally blind. EmpathIQ is the layer that fixes that."*

EmpathIQ is an AI middleware that reads the emotional state and frustration history of a customer across all their support interactions — and tells your support agents exactly how to respond before they say a word.

---

## 🏗 Architecture

```
Customer Message
      ↓
Emotion Detection (RoBERTa / keyword fallback)
      ↓
Sentiment Scoring (DistilBERT / heuristic)
      ↓
Frustration History Scorer (temporal sequential model)
      ↓
Strategy Recommendation Engine (rules + score mapping)
      ↓
Real-Time Strategy Card (React UI)
```

---

## 🚀 Quick Start

### Option A — One command
```bash
chmod +x start.sh
./start.sh
```

### Option B — Manual

**Backend**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
# API running at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

**Frontend** (new terminal)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# UI running at http://localhost:5173
```

---

## 🎮 Demo Scenarios

Once running, hit the three buttons in the top bar:

| Scenario | Description | Expected Score |
|---|---|---|
| ⚡ **The Escalator** | 4th billing ticket, language sharpening | 8.4 / 10 — CRITICAL |
| 👋 **First Timer** | New user, confused but calm | 2.1 / 10 — LOW |
| 🔇 **Silent Churner** | Went quiet 18 days, cold short message | 9.1 / 10 — EMERGENCY |

---

## 🔌 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/analyze` | POST | Analyze a message for a customer |
| `/customers` | GET | List all customers sorted by frustration |
| `/customers/{id}/history` | GET | Full interaction timeline |
| `/simulate` | POST | Load and run a demo scenario |
| `/dashboard/summary` | GET | All customers with risk scores |
| `/health` | GET | API health check |

### Analyze a message
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "cust_001",
    "message": "Still not fixed. 4th time contacting you.",
    "issue_category": "billing"
  }'
```

### Run a scenario
```bash
curl -X POST http://localhost:8000/simulate \
  -H "Content-Type: application/json" \
  -d '{"scenario_name": "escalating"}'
```

---

## 🧠 ML Stack

| Component | Model | Notes |
|---|---|---|
| Emotion Detection | `cardiffnlp/twitter-roberta-base-emotion` | Auto-falls back to keyword engine |
| Sentiment Scoring | `distilbert-base-uncased-finetuned-sst-2-english` | Auto-falls back to heuristic |
| Frustration Scoring | Analytical sequential model | LSTM-style recency weighting |
| Strategy Engine | Rule-augmented score mapping | Decision tree with multipliers |

The transformer models download on first use (~500MB). The fallback engines work immediately for demos.

---

## 📁 Project Structure

```
empathiq/
├── backend/
│   ├── main.py              ← FastAPI app, all endpoints
│   ├── database.py          ← SQLite ORM models
│   ├── schemas.py           ← Pydantic request/response schemas
│   ├── requirements.txt
│   └── models/
│       ├── emotion_detector.py    ← RoBERTa + keyword fallback
│       ├── sentiment_scorer.py    ← DistilBERT + heuristic
│       ├── frustration_lstm.py    ← Temporal frustration scorer
│       └── strategy_engine.py    ← Response strategy mapper
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── pages/
│       │   └── Dashboard.jsx      ← Three-panel layout
│       ├── components/
│       │   ├── CustomerList.jsx   ← Left panel
│       │   ├── ChatFeed.jsx       ← Center panel
│       │   ├── StrategyCard.jsx   ← Right panel (hero)
│       │   ├── FrustrationChart.jsx
│       │   ├── MessageInput.jsx
│       │   ├── FrustrationBadge.jsx
│       │   └── EmotionTag.jsx
│       ├── hooks/
│       │   └── useEmpathIQ.js     ← All state management
│       └── api/
│           └── empathiq.js        ← Axios API calls
├── scenarios/
│   └── demo_scenarios.py          ← 3 preloaded demo scenarios
├── start.sh                       ← One-command startup
└── README.md
```

---

## 📊 Strategy Levels

| Level | Score | Color | Triggers |
|---|---|---|---|
| ✅ Standard | 0–3.5 | Green | First contact, calm user |
| 💛 Acknowledge | 3.5–5.5 | Yellow | Mild frustration detected |
| ⚡ Escalate | 5.5–7.0 | Orange | Repeat issue, escalating tone |
| 🚨 Churn Risk | 7.0–8.5 | Red-Orange | Multiple unresolved + anger |
| 🔥 Emergency | 8.5+ | Deep Red | Silent return, fury, high churn prob |

---

## 🏆 Hackathon Pitch

> *"B2C SaaS companies spend millions on support and churn prevention — separately. EmpathIQ connects them. We reduce churn by making your existing support tools emotionally intelligent. One prevented churn from a high-value customer pays for months of this tool."*

**Live demo flow:**
1. Hit "The Escalator" → watch score build to 8.4, strategy fires CRITICAL
2. Hit "First Timer" → score drops to 2.1, gentle green card
3. Hit "Silent Churner" → score spikes to 9.1, EMERGENCY fires with credit offer

---

Built with ❤️ and a healthy amount of frustration about bad support experiences.
