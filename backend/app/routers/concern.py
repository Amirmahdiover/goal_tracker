from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/concerns", tags=["Concerns"])

MAX_CONCERNS = 5


@router.post("/", response_model=schemas.ConcernResponse)
def create_concern(
    data: schemas.ConcernCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    count = db.query(models.Concern).filter(models.Concern.user_id == user.id).count()
    if count >= MAX_CONCERNS:
        raise HTTPException(
            status_code=400,
            detail="Maximum 5 concerns allowed"
        )

    concern = models.Concern(user_id=user.id, text=data.text)
    db.add(concern)
    db.commit()
    db.refresh(concern)
    return concern


@router.get("/", response_model=list[schemas.ConcernResponse])
def get_concerns(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    return db.query(models.Concern).filter(
        models.Concern.user_id == user.id
    ).order_by(models.Concern.created_at.asc()).all()


@router.put("/{concern_id}", response_model=schemas.ConcernResponse)
def update_concern(
    concern_id: int,
    data: schemas.ConcernUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    concern = db.query(models.Concern).filter(
        models.Concern.id == concern_id,
        models.Concern.user_id == user.id
    ).first()
    if not concern:
        raise HTTPException(status_code=404, detail="Concern not found")

    concern.text = data.text
    db.commit()
    db.refresh(concern)
    return concern


@router.delete("/{concern_id}")
def delete_concern(
    concern_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    concern = db.query(models.Concern).filter(
        models.Concern.id == concern_id,
        models.Concern.user_id == user.id
    ).first()
    if not concern:
        raise HTTPException(status_code=404, detail="Concern not found")

    db.delete(concern)
    db.commit()
    return {"message": "Concern deleted successfully"}