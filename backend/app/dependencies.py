from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from app import models
from app.database import get_db

header_scheme = APIKeyHeader(name="X-User-ID", auto_error=False)

def get_current_user(
    x_user_id: str = Depends(header_scheme),
    db: Session = Depends(get_db),
):
    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail="X-User-ID header is required"
        )

    user = db.query(models.User).filter(models.User.id == x_user_id).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user
