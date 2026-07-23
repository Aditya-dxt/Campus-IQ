"""
End-to-End CampusIQ RAG Chatbot Orchestrator Service.

Coordinates context retrieval, prompt construction, LLM response generation via Groq,
source attribution, conversation memory, confidence metrics, and Retrieval-Only mode fallback.
"""

import logging
import time
import uuid
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.core.exceptions import CampusIQException
from app.services.ai.embeddings import load_model as load_embedding_model
from app.services.ai.llm_provider import (
    check_llm_health,
    generate_response,
    is_groq_configured,
)
from app.services.ai.prompts import (
    build_system_prompt,
    build_user_prompt,
    estimate_prompt_tokens,
)
from app.services.ai.retriever import retrieve_context
from app.services.ai.vector_store import check_vector_store_health

# Set up module logger
logger = logging.getLogger(__name__)

NO_CONTEXT_MESSAGE = (
    "I couldn't find relevant information in the uploaded study material."
)


class ChatbotError(CampusIQException):
    """Exception raised when chatbot question answering fails."""

    pass


class SourceItem(BaseModel):
    """
    Source attribution item for a retrieved context chunk.
    """

    document_id: Optional[str] = Field(None, description="ID of source document.")
    filename: Optional[str] = Field(None, description="Original filename.")
    page: Optional[int] = Field(None, description="OCR page number.")
    heading: Optional[str] = Field(None, description="Section heading.")
    chunk_id: str = Field(..., description="Unique chunk ID.")


class ChatResponse(BaseModel):
    """
    Structured output returned by ask_question.
    Includes metrics, sources, confidence scores, and conversation ID.
    """

    question: str = Field(..., description="User question asked.")
    answer: str = Field(..., description="Generated answer from RAG pipeline.")
    conversation_id: Optional[str] = Field(
        None, description="Conversation session identifier."
    )
    sources: List[SourceItem] = Field(
        default_factory=list, description="List of source chunks used for answer."
    )
    retrieval_time_ms: float = Field(
        ..., description="Context retrieval duration in milliseconds."
    )
    llm_time_ms: float = Field(
        ..., description="LLM inference duration in milliseconds."
    )
    total_time_ms: float = Field(
        ..., description="Total pipeline execution duration in milliseconds."
    )
    prompt_tokens_estimated: int = Field(
        0, description="Estimated prompt token count sent to LLM."
    )
    overall_confidence: float = Field(
        0.0, description="Overall retrieval confidence score (0.0 to 1.0)."
    )


def ask_question(
    question: str,
    conversation_id: Optional[str] = None,
    chat_history: Optional[List[Dict[str, str]]] = None,
    filters: Optional[Dict[str, Any]] = None,
) -> ChatResponse:
    """
    Orchestrate the RAG pipeline to answer a user question using uploaded study material.
    Supports both Full RAG mode (Groq enabled) and Retrieval-Only mode (no Groq key).

    Args:
        question: User query string.
        conversation_id: Optional conversation session identifier for memory tracking.
        chat_history: Optional list of past chat messages [{"role": "user"|"assistant", "content": "..."}].
        filters: Optional metadata filters (e.g. {"document_id": "doc123", "subject": "CS"}).

    Returns:
        ChatResponse object containing answer, sources, confidence, and timing metrics.

    Raises:
        ValueError: If question string is empty or invalid.
        ChatbotError: If RAG pipeline execution fails unexpectedly.
    """
    total_start = time.perf_counter()
    request_id = str(uuid.uuid4())[:8]

    # 1. Validate Question
    if not isinstance(question, str) or not question.strip():
        logger.error("[%s] Invalid question passed to ask_question: %r", request_id, question)
        raise ValueError("Question must be a non-empty string.")

    clean_question = question.strip()
    session_id = conversation_id or f"session_{request_id}"

    logger.info(
        "[%s] Question received for session '%s': '%s' (filters: %s)",
        request_id,
        session_id,
        clean_question[:50],
        filters,
    )

    try:
        # 2. Retrieve Context
        retrieval_res = retrieve_context(clean_question, filters=filters)
        retrieval_time_ms = retrieval_res.retrieval_time_ms

        logger.info(
            "[%s] Retrieval completed in %.2f ms (chunks: %d, confidence: %.2f).",
            request_id,
            retrieval_time_ms,
            retrieval_res.chunk_count,
            retrieval_res.overall_confidence,
        )

        # Build Source Items
        sources: List[SourceItem] = []
        for search_res in retrieval_res.results:
            meta = search_res.metadata or {}
            doc_id = search_res.document_id or meta.get("document_id")
            filename = meta.get("filename")
            page = meta.get("page_start") or meta.get("page")
            heading = meta.get("heading")

            sources.append(
                SourceItem(
                    document_id=doc_id,
                    filename=filename,
                    page=page,
                    heading=heading,
                    chunk_id=search_res.chunk_id,
                )
            )

        # Handle No Context Scenario
        if retrieval_res.chunk_count == 0 or not retrieval_res.context.strip():
            logger.info("[%s] No relevant context found. Returning fallback message.", request_id)
            total_elapsed_ms = round((time.perf_counter() - total_start) * 1000.0, 2)
            return ChatResponse(
                question=clean_question,
                answer=NO_CONTEXT_MESSAGE,
                conversation_id=session_id,
                sources=[],
                retrieval_time_ms=retrieval_time_ms,
                llm_time_ms=0.0,
                total_time_ms=total_elapsed_ms,
                prompt_tokens_estimated=0,
                overall_confidence=0.0,
            )

        # 3. Check for Retrieval-Only Mode (Groq API Key not configured)
        if not is_groq_configured():
            logger.info("[%s] Groq API Key absent -> Operating in Retrieval-Only mode.", request_id)
            total_elapsed_ms = round((time.perf_counter() - total_start) * 1000.0, 2)

            retrieval_only_answer = (
                "CampusIQ is operating in Retrieval-Only mode (Groq API Key not configured). "
                "Here are the retrieved study material contexts for your question:\n\n"
                f"{retrieval_res.context}"
            )

            return ChatResponse(
                question=clean_question,
                answer=retrieval_only_answer,
                conversation_id=session_id,
                sources=sources,
                retrieval_time_ms=retrieval_time_ms,
                llm_time_ms=0.0,
                total_time_ms=total_elapsed_ms,
                prompt_tokens_estimated=0,
                overall_confidence=retrieval_res.overall_confidence,
            )

        # 4. Full RAG Mode: Build Prompts & Call Groq LLM
        system_prompt = build_system_prompt()
        user_prompt = build_user_prompt(
            question=clean_question,
            context=retrieval_res.context,
            chat_history=chat_history,
        )

        estimated_tokens = estimate_prompt_tokens(system_prompt, user_prompt)
        logger.debug("[%s] Estimated prompt tokens: %d.", request_id, estimated_tokens)

        llm_start = time.perf_counter()
        answer = generate_response(system_prompt, user_prompt)
        llm_time_ms = round((time.perf_counter() - llm_start) * 1000.0, 2)

        total_elapsed_ms = round((time.perf_counter() - total_start) * 1000.0, 2)

        logger.info(
            "[%s] Full RAG pipeline execution finished in %.2f ms (Retrieval: %.2f ms, LLM: %.2f ms).",
            request_id,
            total_elapsed_ms,
            retrieval_time_ms,
            llm_time_ms,
        )

        return ChatResponse(
            question=clean_question,
            answer=answer,
            conversation_id=session_id,
            sources=sources,
            retrieval_time_ms=retrieval_time_ms,
            llm_time_ms=llm_time_ms,
            total_time_ms=total_elapsed_ms,
            prompt_tokens_estimated=estimated_tokens,
            overall_confidence=retrieval_res.overall_confidence,
        )

    except ValueError:
        raise
    except Exception as exc:
        logger.exception("[%s] RAG pipeline error: %s", request_id, str(exc))
        raise ChatbotError(f"Error answering question: {exc}") from exc


def check_rag_pipeline_health() -> Dict[str, Any]:
    """
    Check health status across all RAG pipeline services and report operational mode.

    Returns:
        Dict detailing component health, configuration, and operating mode (full_rag vs retrieval_only).
    """
    groq_configured = is_groq_configured()
    llm_available = check_llm_health() if groq_configured else False

    health: Dict[str, Any] = {
        "embedding_model": False,
        "vector_store": False,
        "llm_provider": llm_available,
        "groq_configured": groq_configured,
        "mode": "full_rag" if groq_configured and llm_available else "retrieval_only",
    }

    try:
        load_embedding_model()
        health["embedding_model"] = True
    except Exception as e:
        logger.warning("Health check: embedding model unavailable (%s)", str(e))

    health["vector_store"] = check_vector_store_health()

    health["overall"] = health["embedding_model"] and health["vector_store"]

    return health
