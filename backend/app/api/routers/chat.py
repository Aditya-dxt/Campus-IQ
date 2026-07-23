"""
RAG Chat API Router for CampusIQ Backend.

Exposes POST /api/chat to execute end-to-end grounded Q&A using the AI RAG pipeline.
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.rag import ChatAPIResponse, ChatRequest, SourceItemSchema
from app.services.ai import chatbot_ai
from app.services import conversation_service

# Set up module logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["RAG Chat"],
)


@router.post(
    "/chat",
    response_model=ChatAPIResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask question against indexed study material using RAG pipeline",
)
def chat_with_study_material(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Execute grounded study question answering.
    Orchestrates retrieval, context building, LLM generation, source attribution,
    and conversation memory persistence.
    """
    logger.info("Chat request received from user '%s': '%s'", current_user.email, request.question[:50])

    try:
        # Fetch past conversation history for memory injection if conversation_id provided
        chat_history = None
        if request.conversation_id:
            chat_history = conversation_service.get_chat_history(request.conversation_id)

        # Inject user_id filter if not explicitly overridden
        query_filters: Dict[str, Any] = request.filters or {}

        # Call chatbot_ai orchestrator
        chat_res = chatbot_ai.ask_question(
            question=request.question,
            conversation_id=request.conversation_id,
            chat_history=chat_history,
            filters=query_filters,
        )

        # Persist exchange to conversation history
        active_conv_id = conversation_service.save_chat_turn(
            conversation_id=chat_res.conversation_id,
            user_id=str(current_user.id),
            question=request.question,
            answer=chat_res.answer,
            sources=chat_res.sources,
        )

        sources_schema = [
            SourceItemSchema(
                document_id=s.document_id,
                filename=s.filename,
                page=s.page,
                heading=s.heading,
                chunk_id=s.chunk_id,
            )
            for s in chat_res.sources
        ]

        return ChatAPIResponse(
            question=chat_res.question,
            answer=chat_res.answer,
            conversation_id=active_conv_id,
            sources=sources_schema,
            overall_confidence=chat_res.overall_confidence,
            retrieval_time_ms=chat_res.retrieval_time_ms,
            llm_time_ms=chat_res.llm_time_ms,
            total_time_ms=chat_res.total_time_ms,
        )

    except ValueError as val_err:
        logger.warning("Chat validation error: %s", str(val_err))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        logger.exception("Chat execution failed: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat pipeline error: {exc}",
        )
