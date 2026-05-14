import os
import sys

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
FRONTEND_ASSETS = os.path.join(FRONTEND_DIST, "assets")

sys.path.insert(0, BACKEND_DIR)

from app.main import app as backend_app

app = FastAPI(title="Goal Tracker Web App")

# Backend API زیر /api
app.mount("/api", backend_app)

# Frontend assets
if os.path.isdir(FRONTEND_ASSETS):
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS), name="assets")


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    requested_file = os.path.join(FRONTEND_DIST, full_path)

    if full_path and os.path.isfile(requested_file):
        return FileResponse(requested_file)

    index_file = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)

    return {"message": "Frontend dist not found"}