from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/tracking", tags=["Tracking"])


@router.post("/", response_model=schemas.TrackingResponse)
def add_tracking(
    data: schemas.TrackingCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(models.Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    step = db.query(models.Step).filter(
        models.Step.id == data.step_id,
        models.Step.goal_id == goal.id
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found for this goal")

    tracking = models.Tracking(
        goal_id=goal.id,
        step_id=data.step_id,
        amount=data.amount,
        date=data.date,
        note=data.note,
    )
    db.add(tracking)
    db.commit()
    db.refresh(tracking)
    return tracking


@router.get("/", response_model=list[schemas.TrackingHistoryResponse])
def get_tracking_history(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(models.Goal.user_id == user.id).first()
    if not goal:
        return []

    rows = (
        db.query(models.Tracking, models.Step)
        .join(models.Step, models.Tracking.step_id == models.Step.id)
        .filter(models.Tracking.goal_id == goal.id)
        .order_by(models.Tracking.date.desc(), models.Tracking.created_at.desc())
        .all()
    )

    return [
        {
            "id": tracking.id,
            "goal_id": tracking.goal_id,
            "step_id": tracking.step_id,
            "step_title": step.title,
            "unit": step.unit,
            "amount": tracking.amount,
            "date": tracking.date,
            "note": tracking.note,
            "created_at": tracking.created_at,
        }
        for tracking, step in rows
    ]


@router.put("/{tracking_id}", response_model=schemas.TrackingResponse)
def update_tracking(
    tracking_id: int,
    data: schemas.TrackingUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(models.Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    tracking = db.query(models.Tracking).filter(
        models.Tracking.id == tracking_id,
        models.Tracking.goal_id == goal.id
    ).first()
    if not tracking:
        raise HTTPException(status_code=404, detail="Tracking not found")

    if data.amount is not None:
        tracking.amount = data.amount
    if data.date is not None:
        tracking.date = data.date
    if data.note is not None:
        tracking.note = data.note

    db.commit()
    db.refresh(tracking)
    return tracking


@router.delete("/{tracking_id}")
def delete_tracking(
    tracking_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(models.Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    tracking = db.query(models.Tracking).filter(
        models.Tracking.id == tracking_id,
        models.Tracking.goal_id == goal.id
    ).first()
    if not tracking:
        raise HTTPException(status_code=404, detail="Tracking not found")

    db.delete(tracking)
    db.commit()
    return {"message": "Tracking deleted successfully"}