from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List, Literal


# --- Goal ---
class GoalCreate(BaseModel):
    title: str


class GoalUpdate(BaseModel):
    title: Optional[str] = None


class GoalResponse(BaseModel):
    id: str
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class GoalSummary(BaseModel):
    goal_id: str
    title: str
    progress_percent: float          # میانگین درصد stepها
    has_steps: bool
    steps_count: int


# --- Step ---
class StepCreate(BaseModel):
    title: str
    target_value: float = Field(..., gt=0)
    unit: str
    order_index: int


class StepCreateRequest(BaseModel):
    steps: list[StepCreate]


class StepUpdate(BaseModel):
    title: Optional[str] = None
    target_value: Optional[float] = Field(default=None, gt=0)
    unit: Optional[str] = None
    order_index: Optional[int] = None


class StepResponse(BaseModel):
    id: int
    goal_id: str
    title: str
    target_value: float
    unit: str
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True


class StepProgressResponse(BaseModel):
    id: int
    goal_id: str
    title: str
    target_value: float
    unit: str
    order_index: int
    current_progress: float
    remaining: float
    progress_percent: float          # min(..., 100) برای نمایش
    created_at: datetime

    class Config:
        from_attributes = True


# --- Tracking ---
class TrackingCreate(BaseModel):
    amount: float = Field(..., gt=0)
    date: date
    step_id: int
    note: Optional[str] = None


class TrackingUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    date: Optional[date] = None
    note: Optional[str] = None


class TrackingResponse(BaseModel):
    id: int
    goal_id: str
    step_id: int
    amount: float
    date: date
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TrackingHistoryResponse(BaseModel):
    id: int
    goal_id: str
    step_id: int
    step_title: str
    unit: str
    amount: float
    date: date
    note: Optional[str] = None
    created_at: datetime


# --- Concern ---
class ConcernCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


class ConcernUpdate(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


class ConcernResponse(BaseModel):
    id: int
    text: str
    created_at: datetime

    class Config:
        from_attributes = True