from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI

from app.core.config import settings
from app.api.routers.auth import router as auth_router
from app.api.routers import admin, analysis, dashboard, resume, study_material
from app.api.routers import chat, conversation, documents, health as rag_health, upload
from app.services.ai.llm_provider import is_groq_configured

# Set up module logger
logger = logging.getLogger("campusiq")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle events.
    """
    logger.info("Initializing CampusIQ Backend application...")

    # Startup Validation of Groq LLM Provider
    if is_groq_configured():
        logger.info(
            "Groq provider initialized successfully (Model: %s). Full RAG mode active.",
            settings.GROQ_MODEL,
        )
    else:
        logger.info(
            "GROQ_API_KEY not configured. CampusIQ running in Retrieval-Only mode."
        )

    yield

    logger.info("CampusIQ Backend shutting down.")


app = FastAPI(
    title="CampusIQ API",
    description="CampusIQ Production Backend API with RAG Document Ingestion & AI Chatbot Capabilities.",
    version="1.0.0",
    lifespan=lifespan,
)

# Core Feature Routers
app.include_router(auth_router)
app.include_router(resume.router)
app.include_router(analysis.router)
app.include_router(dashboard.router)
app.include_router(study_material.router)
app.include_router(admin.router)

# RAG API Routers
app.include_router(upload.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(conversation.router)
app.include_router(rag_health.router)


@app.get("/", tags=["System Root"])
def root():
    return {
        "message": "CampusIQ Production Backend API Running",
        "version": "1.0.0",
        "mode": "full_rag" if is_groq_configured() else "retrieval_only",
        "documentation": "/docs",
    }


@app.get("/health", tags=["System Root"])
def health():
    return {
        "status": "healthy",
        "service": "CampusIQ Backend",
        "mode": "full_rag" if is_groq_configured() else "retrieval_only",
    }