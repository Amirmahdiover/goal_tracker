from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/goal",
    tags=["Goal"]
)


@router.post("/", response_model=schemas.GoalResponse)
def create_goal(
    goal: schemas.GoalCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    existing_goal = db.query(models.Goal).filter(
        models.Goal.user_id == user.id
    ).first()

    if existing_goal:
        raise HTTPException(
            status_code=400,
            detail="User already has an active goal"
        )

    db_goal = models.Goal(
        title=goal.title,
        goal_type=goal.goal_type,
        target_value=goal.target_value,
        user_id=user.id
    )

    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)

    return db_goal


@router.get("/", response_model=schemas.GoalResponse)
def get_goal(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(
        models.Goal.user_id == user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    return goal


@router.put("/", response_model=schemas.GoalResponse)
def update_goal(
    data: schemas.GoalUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(
        models.Goal.user_id == user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if data.title is not None:
        goal.title = data.title

    if data.target_value is not None:
        goal.target_value = data.target_value

    db.commit()
    db.refresh(goal)

    return goal


@router.delete("/")
def delete_goal(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(
        models.Goal.user_id == user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()

    return {"message": "Goal deleted successfully"}


@router.get("/summary", response_model=schemas.GoalSummary)
def get_goal_summary(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(
        models.Goal.user_id == user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    total = db.query(func.sum(models.Tracking.amount)).filter(
        models.Tracking.goal_id == goal.id
    ).scalar()

    total_progress = total or 0
    remaining = max(goal.target_value - total_progress, 0)

    progress_percent = (
        total_progress / goal.target_value * 100
        if goal.target_value > 0
        else 0
    )

    days_passed = max((datetime.utcnow() - goal.created_at).days, 1)
    daily_average = total_progress / days_passed

    estimated_days_left = (
        remaining / daily_average
        if daily_average > 0
        else None
    )

    milestone_count = db.query(models.Milestone).filter(
        models.Milestone.goal_id == goal.id
    ).count()

    return {
        "goal_id": goal.id,
        "title": goal.title,
        "goal_type": goal.goal_type,
        "target_value": goal.target_value,
        "total_progress": total_progress,
        "remaining": remaining,
        "progress_percent": progress_percent,
        "daily_average": daily_average,
        "estimated_days_left": estimated_days_left,
        "has_milestones": milestone_count > 0
    }