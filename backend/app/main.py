from fastapi import FastAPI

from app.api.routers.auth import router as auth_router
from app.api.routers import resume
from app.api.routers import analysis
from app.api.routers import dashboard

app = FastAPI(
    title="CampusIQ API",
    version="1.0.0",
)

app.include_router(auth_router)
app.include_router(resume.router)
app.include_router(analysis.router)
app.include_router(
    dashboard.router,
)

@app.get("/")
def root():
    return {
        "message": "CampusIQ Backend Running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }