from fastapi import FastAPI, Depends
from .database import engine, Base
from .routers import goal, tracking, steps, concern
from app.database import get_db
from app.dependencies import header_scheme

from fastapi.middleware.cors import CORSMiddleware

# uvicorn app.main:app --reload
# npm run dev
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Goal Tracker API",
    dependencies=[Depends(header_scheme)]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(goal.router)
app.include_router(tracking.router)
app.include_router(steps.router)
app.include_router(concern.router)














# -----------------------------------------------------------------------------

# for swagger test
from app import models
from app.database import SessionLocal
from fastapi import Depends
from sqlalchemy.orm import Session
import uuid

@app.post("/create-user")
def create_user(db: Session = Depends(get_db)):
    user = models.User(
        id=str(uuid.uuid4())
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user