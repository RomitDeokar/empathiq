"""
EmpathIQ — Database module
SQLite + SQLAlchemy ORM
"""
import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'empathiq.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    plan_tier = Column(String, default="standard")
    join_date = Column(DateTime, default=datetime.utcnow)
    avatar_color = Column(String, default="#5AC8FA")
    current_frustration_score = Column(Float, default=0.0)
    current_churn_probability = Column(Float, default=0.0)

    interactions = relationship(
        "Interaction",
        back_populates="customer",
        order_by="Interaction.timestamp",
        cascade="all, delete-orphan",
    )
    strategy_logs = relationship(
        "StrategyLog",
        back_populates="customer",
        cascade="all, delete-orphan",
    )


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(String, ForeignKey("customers.id", ondelete="CASCADE"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    message = Column(Text, nullable=False)

    # ML outputs
    emotion_label = Column(String)
    emotion_raw = Column(String)
    emotion_color = Column(String)
    emotion_icon = Column(String)
    sentiment_score = Column(Float)
    sentiment_label = Column(String)
    frustration_score = Column(Float)

    # Context
    issue_category = Column(String, default="general")
    resolved = Column(Boolean, default=False)
    days_ago = Column(Integer, default=0)

    customer = relationship("Customer", back_populates="interactions")


class StrategyLog(Base):
    __tablename__ = "strategy_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(String, ForeignKey("customers.id", ondelete="CASCADE"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    strategy_level = Column(String)
    strategy_label = Column(String)
    frustration_score = Column(Float)
    churn_probability = Column(Float)
    flags = Column(Text)  # JSON string

    customer = relationship("Customer", back_populates="strategy_logs")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
