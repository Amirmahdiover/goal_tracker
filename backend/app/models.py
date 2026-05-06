from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
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

    goals = relationship(
        "Goal",
        back_populates="user",
        cascade="all, delete"
    )


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    goal_type = Column(String, nullable=False)
    target_value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="goals")

    trackings = relationship(
        "Tracking",
        back_populates="goal",
        cascade="all, delete-orphan"
    )

    milestones = relationship(
        "Milestone",
        back_populates="goal",
        cascade="all, delete-orphan"
    )


class Tracking(Base):
    __tablename__ = "tracking"

    id = Column(Integer, primary_key=True, index=True)

    goal_id = Column(
        String,
        ForeignKey("goals.id", ondelete="CASCADE"),
        nullable=False
    )

    milestone_id = Column(
        Integer,
        ForeignKey("milestones.id", ondelete="SET NULL"),
        nullable=True
    )

    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    goal = relationship("Goal", back_populates="trackings")
    milestone = relationship("Milestone", back_populates="trackings")



class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)

    goal_id = Column(
        String,
        ForeignKey("goals.id", ondelete="CASCADE"),
        nullable=False
    )

    title = Column(String, nullable=False)
    target_value = Column(Float, nullable=False)
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    goal = relationship("Goal", back_populates="milestones")

    trackings = relationship(
        "Tracking",
        back_populates="milestone"
    )