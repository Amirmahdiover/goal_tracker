from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List, Literal


class GoalCreate(BaseModel):
    title: str
    goal_type: Literal["hours", "count"]
    target_value: float = Field(..., gt=0)


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_value: Optional[float] = Field(default=None, gt=0)


class GoalResponse(BaseModel):
    id: str
    title: str
    goal_type: str
    target_value: float
    created_at: datetime

    class Config:
        from_attributes = True


class GoalSummary(BaseModel):
    goal_id: str
    title: str
    goal_type: str
    target_value: float
    total_progress: float
    remaining: float
    progress_percent: float
    daily_average: float
    estimated_days_left: Optional[float]
    has_milestones: bool


class TrackingCreate(BaseModel):
    amount: float = Field(..., gt=0)
    date: date
    milestone_id: Optional[int] = None


class TrackingResponse(BaseModel):
    id: int
    goal_id: str
    milestone_id: Optional[int] = None
    amount: float
    date: date
    created_at: datetime

    class Config:
        from_attributes = True

class MilestoneCreate(BaseModel):
    title: str
    target_value: float = Field(..., gt=0)
    order_index: int


class MilestoneCreateRequest(BaseModel):
    milestones: list[MilestoneCreate]


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    target_value: Optional[float] = Field(default=None, gt=0)
    order_index: Optional[int] = None


class MilestoneResponse(BaseModel):
    id: int
    goal_id: str
    title: str
    target_value: float
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True


class MilestoneProgressResponse(BaseModel):
    id: int
    goal_id: str
    title: str
    target_value: float
    order_index: int
    current_progress: float
    remaining: float
    progress_percent: float
    bar_width_percent: float
    created_at: datetime

    class Config:
        from_attributes = True