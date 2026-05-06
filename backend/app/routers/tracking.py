from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user
from sqlalchemy import func

router = APIRouter(
    prefix="/tracking",
    tags=["Tracking"]
)


@router.post("/", response_model=schemas.TrackingResponse)
def add_tracking(
    data: schemas.TrackingCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(
        models.Goal.user_id == user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    milestone_count = db.query(models.Milestone).filter(
        models.Milestone.goal_id == goal.id
    ).count()

    if milestone_count > 0 and data.milestone_id is None:
        raise HTTPException(
            status_code=400,
            detail="This goal has milestones. Please select a milestone for this tracking record."
        )

    milestone = None

    if data.milestone_id is not None:
        milestone = db.query(models.Milestone).filter(
            models.Milestone.id == data.milestone_id,
            models.Milestone.goal_id == goal.id
        ).first()

        if not milestone:
            raise HTTPException(
                status_code=404,
                detail="Milestone not found for this user's goal"
            )

        current_milestone_progress = db.query(func.sum(models.Tracking.amount)).filter(
            models.Tracking.milestone_id == milestone.id
        ).scalar() or 0

        if current_milestone_progress + data.amount > milestone.target_value:
            raise HTTPException(
                status_code=400,
                detail="Tracking amount exceeds milestone target"
            )

    current_goal_progress = db.query(func.sum(models.Tracking.amount)).filter(
        models.Tracking.goal_id == goal.id
    ).scalar() or 0

    if current_goal_progress + data.amount > goal.target_value:
        raise HTTPException(
            status_code=400,
            detail="Tracking amount exceeds goal target"
        )

    tracking = models.Tracking(
        goal_id=goal.id,
        milestone_id=data.milestone_id,
        amount=data.amount,
        date=data.date
    )

    db.add(tracking)
    db.commit()
    db.refresh(tracking)

    return tracking


@router.get("/", response_model=list[schemas.TrackingResponse])
def get_tracking_history(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(
        models.Goal.user_id == user.id
    ).first()

    if not goal:
        return []

    history = db.query(models.Tracking).filter(
        models.Tracking.goal_id == goal.id
    ).order_by(models.Tracking.date.desc()).all()

    return history


@router.delete("/{tracking_id}")
def delete_tracking(
    tracking_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(
        models.Goal.user_id == user.id
    ).first()

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