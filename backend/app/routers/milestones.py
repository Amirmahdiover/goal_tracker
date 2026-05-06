from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user
from sqlalchemy import func

from app.routers import goal

router = APIRouter(
    tags=["Milestones"]
)


def get_current_user_goal(db: Session, user: models.User):
    goal = db.query(models.Goal).filter(
        models.Goal.user_id == user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    return goal


@router.post("/goal/milestones", response_model=list[schemas.MilestoneResponse])
def create_milestones(
    data: schemas.MilestoneCreateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = db.query(models.Goal).filter(
        models.Goal.user_id == user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    tracking_count = db.query(models.Tracking).filter(
        models.Tracking.goal_id == goal.id
    ).count()

    if tracking_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Milestones can only be added before tracking starts"
        )

    existing_milestones_count = db.query(models.Milestone).filter(
        models.Milestone.goal_id == goal.id
    ).count()

    if existing_milestones_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Milestones already exist for this goal"
        )

    if not data.milestones:
        raise HTTPException(
            status_code=400,
            detail="At least one milestone is required"
        )

    total_milestone_target = sum(
        milestone.target_value for milestone in data.milestones
    )

    if total_milestone_target != goal.target_value:
        raise HTTPException(
            status_code=400,
            detail="Sum of milestone target values must equal goal target value"
        )

    order_indexes = [milestone.order_index for milestone in data.milestones]

    if len(order_indexes) != len(set(order_indexes)):
        raise HTTPException(
            status_code=400,
            detail="Milestone order_index values must be unique"
        )

    milestones = []

    for item in data.milestones:
        milestone = models.Milestone(
            goal_id=goal.id,
            title=item.title,
            target_value=item.target_value,
            order_index=item.order_index
        )

        db.add(milestone)
        milestones.append(milestone)

    db.commit()

    for milestone in milestones:
        db.refresh(milestone)

    return milestones


@router.get("/goal/milestones", response_model=list[schemas.MilestoneProgressResponse])
def get_milestones(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = get_current_user_goal(db, user)

    milestones = db.query(models.Milestone).filter(
        models.Milestone.goal_id == goal.id
    ).order_by(models.Milestone.order_index.asc()).all()

    result = []

    for milestone in milestones:
        current_progress = db.query(func.sum(models.Tracking.amount)).filter(
            models.Tracking.milestone_id == milestone.id
        ).scalar() or 0

        remaining = max(milestone.target_value - current_progress, 0)

        progress_percent = (
            current_progress / milestone.target_value * 100
            if milestone.target_value > 0
            else 0
        )

        bar_width_percent = (
            milestone.target_value / goal.target_value * 100
            if goal.target_value > 0
            else 0
        )

        result.append({
            "id": milestone.id,
            "goal_id": milestone.goal_id,
            "title": milestone.title,
            "target_value": milestone.target_value,
            "order_index": milestone.order_index,
            "current_progress": current_progress,
            "remaining": remaining,
            "progress_percent": progress_percent,
            "bar_width_percent": bar_width_percent,
            "created_at": milestone.created_at
        })

    return result


@router.put("/milestones/{milestone_id}", response_model=schemas.MilestoneResponse)
def update_milestone(
    milestone_id: int,
    data: schemas.MilestoneUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = get_current_user_goal(db, user)

    milestone = db.query(models.Milestone).filter(
        models.Milestone.id == milestone_id,
        models.Milestone.goal_id == goal.id
    ).first()

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    if data.title is not None:
        milestone.title = data.title

    if data.target_value is not None:
        milestone.target_value = data.target_value

    if data.order_index is not None:
        milestone.order_index = data.order_index

    other_milestones_total = db.query(func.sum(models.Milestone.target_value)).filter(
        models.Milestone.goal_id == goal.id,
        models.Milestone.id != milestone.id
    ).scalar() or 0

    new_target = data.target_value if data.target_value is not None else milestone.target_value

    if other_milestones_total + new_target > goal.target_value:
        raise HTTPException(
            status_code=400,
            detail="Total milestone targets cannot exceed goal target value"
        )

    db.commit()
    db.refresh(milestone)

    return milestone


@router.delete("/milestones/{milestone_id}")
def delete_milestone(
    milestone_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = get_current_user_goal(db, user)

    milestone = db.query(models.Milestone).filter(
        models.Milestone.id == milestone_id,
        models.Milestone.goal_id == goal.id
    ).first()

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    db.delete(milestone)
    db.commit()

    return {"message": "Milestone deleted successfully"}