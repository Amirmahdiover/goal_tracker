from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text
from datetime import datetime
from .database import Base
import uuid
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active_at = Column(DateTime(timezone=True), onupdate=func.now())

    goals = relationship("Goal", back_populates="user", cascade="all, delete")
    concerns = relationship("Concern", back_populates="user", cascade="all, delete")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    user = relationship("User", back_populates="goals")
    steps = relationship(
        "Step",
        back_populates="goal",
        cascade="all, delete-orphan"
    )


class Step(Base):
    __tablename__ = "steps"

    id = Column(Integer, primary_key=True, index=True)

    goal_id = Column(
        String,
        ForeignKey("goals.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title = Column(String, nullable=False)
    target_value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    goal = relationship("Goal", back_populates="steps")
    trackings = relationship(
        "Tracking",
        back_populates="step",
        cascade="all, delete-orphan"
    )


class Tracking(Base):
    __tablename__ = "tracking"

    id = Column(Integer, primary_key=True, index=True)

    goal_id = Column(
        String,
        ForeignKey("goals.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    step_id = Column(
        Integer,
        ForeignKey("steps.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    goal = relationship("Goal")
    step = relationship("Step", back_populates="trackings")

class Concern(Base):
    __tablename__ = "concerns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="concerns")