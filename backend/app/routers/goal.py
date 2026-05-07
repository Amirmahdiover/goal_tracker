from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user


router = APIRouter(prefix="/goal", tags=["Goal"])


@router.post("/", response_model=schemas.GoalResponse)
def create_goal(
    goal: schemas.GoalCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Goal).filter(models.Goal.user_id == user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already has an active goal")

    db_goal = models.Goal(title=goal.title, user_id=user.id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.get("/", response_model=schemas.GoalResponse)
def get_goal(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(models.Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/", response_model=schemas.GoalResponse)
def update_goal(
    data: schemas.GoalUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(models.Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if data.title is not None:
        goal.title = data.title

    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/")
def delete_goal(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(models.Goal.user_id == user.id).first()
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
    goal = db.query(models.Goal).filter(models.Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    steps = db.query(models.Step).filter(models.Step.goal_id == goal.id).all()

    if not steps:
        return {
            "goal_id": goal.id,
            "title": goal.title,
            "progress_percent": 0.0,
            "has_steps": False,
            "steps_count": 0,
        }

    step_percents = []
    for step in steps:
        done = db.query(func.sum(models.Tracking.amount)).filter(
            models.Tracking.step_id == step.id
        ).scalar() or 0
        raw_percent = (done / step.target_value * 100) if step.target_value > 0 else 0
        step_percents.append(min(raw_percent, 100))

    goal_progress = sum(step_percents) / len(step_percents)

    return {
        "goal_id": goal.id,
        "title": goal.title,
        "progress_percent": round(goal_progress, 1),
        "has_steps": True,
        "steps_count": len(steps),
    }