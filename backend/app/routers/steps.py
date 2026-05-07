from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(tags=["Steps"])

MAX_STEPS = 5


def get_user_goal(db: Session, user: models.User) -> models.Goal:
    goal = db.query(models.Goal).filter(models.Goal.user_id == user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.post("/goal/steps", response_model=list[schemas.StepResponse])
def create_steps(
    data: schemas.StepCreateRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = get_user_goal(db, user)

    existing_count = db.query(models.Step).filter(models.Step.goal_id == goal.id).count()
    if existing_count > 0:
        raise HTTPException(status_code=400, detail="Steps already exist for this goal")

    if not data.steps:
        raise HTTPException(status_code=400, detail="At least one step is required")

    if len(data.steps) > MAX_STEPS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_STEPS} steps allowed")

    order_indexes = [s.order_index for s in data.steps]
    if len(order_indexes) != len(set(order_indexes)):
        raise HTTPException(status_code=400, detail="Step order_index values must be unique")

    steps = []
    for item in data.steps:
        step = models.Step(
            goal_id=goal.id,
            title=item.title,
            target_value=item.target_value,
            unit=item.unit,
            order_index=item.order_index,
        )
        db.add(step)
        steps.append(step)

    db.commit()
    for step in steps:
        db.refresh(step)
    return steps


@router.get("/goal/steps", response_model=list[schemas.StepProgressResponse])
def get_steps(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = get_user_goal(db, user)

    steps = db.query(models.Step).filter(
        models.Step.goal_id == goal.id
    ).order_by(models.Step.order_index.asc()).all()

    result = []
    for step in steps:
        done = db.query(func.sum(models.Tracking.amount)).filter(
            models.Tracking.step_id == step.id
        ).scalar() or 0

        remaining = max(step.target_value - done, 0)
        raw_percent = (done / step.target_value * 100) if step.target_value > 0 else 0
        display_percent = min(raw_percent, 100)

        result.append({
            "id": step.id,
            "goal_id": step.goal_id,
            "title": step.title,
            "target_value": step.target_value,
            "unit": step.unit,
            "order_index": step.order_index,
            "current_progress": done,
            "remaining": remaining,
            "progress_percent": round(display_percent, 1),
            "created_at": step.created_at,
        })

    return result


@router.post("/goal/steps/add", response_model=schemas.StepResponse)
def add_step(
    data: schemas.StepCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """اضافه کردن یک Step جدید به Goal موجود (از Dashboard)"""
    goal = get_user_goal(db, user)

    current_count = db.query(models.Step).filter(models.Step.goal_id == goal.id).count()
    if current_count >= MAX_STEPS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_STEPS} steps allowed")

    existing_order = db.query(models.Step).filter(
        models.Step.goal_id == goal.id,
        models.Step.order_index == data.order_index
    ).first()

    if existing_order:
        raise HTTPException(
            status_code=400,
            detail="Step order_index already exists"
        )

    step = models.Step(
        goal_id=goal.id,
        title=data.title,
        target_value=data.target_value,
        unit=data.unit,
        order_index=data.order_index,
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


@router.put("/steps/{step_id}", response_model=schemas.StepResponse)
def update_step(
    step_id: int,
    data: schemas.StepUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = get_user_goal(db, user)

    step = db.query(models.Step).filter(
        models.Step.id == step_id,
        models.Step.goal_id == goal.id
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    if data.title is not None:
        step.title = data.title

    if data.target_value is not None:
        step.target_value = data.target_value

    if data.unit is not None:
        step.unit = data.unit

    if data.order_index is not None:
        existing_order = db.query(models.Step).filter(
            models.Step.goal_id == goal.id,
            models.Step.order_index == data.order_index,
            models.Step.id != step.id
        ).first()

        if existing_order:
            raise HTTPException(
                status_code=400,
                detail="Step order_index already exists"
            )

        step.order_index = data.order_index

    db.commit()
    db.refresh(step)
    return step


@router.delete("/steps/{step_id}")
def delete_step(
    step_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    goal = get_user_goal(db, user)

    step = db.query(models.Step).filter(
        models.Step.id == step_id,
        models.Step.goal_id == goal.id
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    db.delete(step)
    db.commit()
    return {"message": "Step deleted successfully"}