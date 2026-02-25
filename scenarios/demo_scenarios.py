"""
Demo scenarios — preloaded customer histories for hackathon demo
"""
import json
from datetime import datetime, timedelta

DEMO_SCENARIOS = {
    "escalating": {
        "customer": {
            "id": "cust_001",
            "name": "Marcus Chen",
            "email": "marcus@techco.io",
            "plan_tier": "pro",
            "avatar_color": "#FF6B35",
        },
        "interactions": [
            {
                "message": "Hi, I think there might be an issue with my billing. I was charged twice this month?",
                "emotion_label": "Confused",
                "emotion_raw": "confused",
                "emotion_color": "#5AC8FA",
                "emotion_icon": "😕",
                "sentiment_score": -0.2,
                "sentiment_label": "Neutral",
                "frustration_score": 2.5,
                "issue_category": "billing",
                "resolved": False,
                "days_ago": 14,
            },
            {
                "message": "Still waiting on the billing refund. It's been 5 days. Can someone please look into this?",
                "emotion_label": "Annoyed",
                "emotion_raw": "annoyed",
                "emotion_color": "#FFCC00",
                "emotion_icon": "😤",
                "sentiment_score": -0.55,
                "sentiment_label": "Negative",
                "frustration_score": 4.8,
                "issue_category": "billing",
                "resolved": False,
                "days_ago": 9,
            },
            {
                "message": "You marked my ticket as 'resolved' but the charge is STILL on my account. This is really frustrating. I shouldn't have to keep chasing this.",
                "emotion_label": "Angry",
                "emotion_raw": "angry",
                "emotion_color": "#FF6B35",
                "emotion_icon": "😠",
                "sentiment_score": -0.78,
                "sentiment_label": "Highly Negative",
                "frustration_score": 6.9,
                "issue_category": "billing",
                "resolved": False,
                "days_ago": 4,
            },
        ],
        "current_message": "Still not fixed. 4th time contacting you about the same billing issue.",
    },

    "first_timer": {
        "customer": {
            "id": "cust_002",
            "name": "Priya Sharma",
            "email": "priya@startup.com",
            "plan_tier": "standard",
            "avatar_color": "#34C759",
        },
        "interactions": [],
        "current_message": "Hello! I just signed up yesterday and I'm having a bit of trouble finding where to connect my Slack workspace. Could you help me out? I looked through the docs but wasn't totally sure.",
    },

    "silent_churner": {
        "customer": {
            "id": "cust_003",
            "name": "Jordan Taylor",
            "email": "jtaylor@bigcorp.com",
            "plan_tier": "enterprise",
            "avatar_color": "#AF52DE",
        },
        "interactions": [
            {
                "message": "Your export feature is completely broken. I've lost 3 hours of work because of this. This is unacceptable for an enterprise product.",
                "emotion_label": "Angry",
                "emotion_raw": "angry",
                "emotion_color": "#FF6B35",
                "emotion_icon": "😠",
                "sentiment_score": -0.82,
                "sentiment_label": "Highly Negative",
                "frustration_score": 7.2,
                "issue_category": "product_bug",
                "resolved": False,
                "days_ago": 22,
            },
            {
                "message": "Still broken. I don't even know why I bother filing tickets.",
                "emotion_label": "Defeated",
                "emotion_raw": "defeated",
                "emotion_color": "#AF52DE",
                "emotion_icon": "😔",
                "sentiment_score": -0.71,
                "sentiment_label": "Highly Negative",
                "frustration_score": 7.8,
                "issue_category": "product_bug",
                "resolved": False,
                "days_ago": 20,
            },
        ],
        "current_message": "I need to talk to someone about our account.",
        "note": "Went silent for 18 days — now returning with a cold, short message.",
    },
}


def get_scenario(name: str):
    return DEMO_SCENARIOS.get(name)


def list_scenarios():
    return list(DEMO_SCENARIOS.keys())
