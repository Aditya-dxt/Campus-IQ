"""
Health Diagnostics API Router for CampusIQ RAG Backend.

Exposes GET /api/health to inspect system readiness across embedding model, ChromaDB, and Groq API.
"""

import logging

from fastapi import APIRouter, status

from app.core.config import settings
from app.schemas.rag import HealthResponse, LLMHealthDetails
from app.services.ai.chatbot_ai import check_rag_pipeline_health
from app.services.ai.llm_provider import is_groq_configured

# Set up module logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["System Health"],
)


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Get complete RAG system health status",
)
def get_rag_health():
    """
    Check component readiness for embedding model, ChromaDB vector store, and Groq API provider.
    Reports operational mode ('full_rag' vs 'retrieval_only').
    """
    health_dict = check_rag_pipeline_health()
    groq_conf = is_groq_configured()
    groq_avail = health_dict.get("llm_provider", False)
    mode = "full_rag" if groq_conf and groq_avail else "retrieval_only"

    overall = health_dict.get("overall", False)

    return HealthResponse(
        status="healthy" if overall else "degraded",
        mode=mode,
        llm=LLMHealthDetails(
            provider="Groq",
            configured=groq_conf,
            available=groq_avail,
            model=settings.GROQ_MODEL,
            mode=mode,
        ),
        components={
            "embedding_model": health_dict.get("embedding_model", False),
            "vector_store": health_dict.get("vector_store", False),
            "llm_provider": groq_avail,
        },
    )
