"""
RAG Context Retrieval Service for CampusIQ.

Orchestrates dense query embedding generation, two-stage vector retrieval, similarity score
thresholding, reranking, chunk deduplication, confidence scoring, and context string building.
"""

import hashlib
import json
import logging
import time
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.core.exceptions import CampusIQException
from app.services.ai.embeddings import embed_query
from app.services.ai.vector_store import SearchResult, similarity_search

# Set up module logger
logger = logging.getLogger(__name__)

# Configurable defaults
SEARCH_TOP_K = 15
FINAL_TOP_K = 5
MIN_SIMILARITY_SCORE = 0.2
MAX_CONTEXT_CHARS = 4000
ENABLE_CACHE = True

# In-memory query retrieval cache
_RETRIEVAL_CACHE: Dict[str, Any] = {}
_CACHE_MAX_ENTRIES = 200


class RetrievalError(CampusIQException):
    """Exception raised when RAG context retrieval fails."""

    pass


class RetrievalResult(BaseModel):
    """
    Structured container for RAG query context retrieval results.
    Includes confidence metrics for answer reliability assessment.
    """

    query: str = Field(..., description="Original search query string.")
    query_embedding: List[float] = Field(
        ..., description="Dense vector embedding of search query."
    )
    results: List[SearchResult] = Field(
        default_factory=list, description="Filtered and reranked SearchResult items."
    )
    context: str = Field(
        ..., description="Formatted markdown/text context string for LLM."
    )
    retrieval_time_ms: float = Field(
        ..., description="Total retrieval elapsed time in milliseconds."
    )
    chunk_count: int = Field(
        ..., description="Total number of relevant chunks included in context."
    )
    highest_similarity: float = Field(
        0.0, description="Highest similarity score among retrieved chunks."
    )
    average_similarity: float = Field(
        0.0, description="Average similarity score of retrieved chunks."
    )
    overall_confidence: float = Field(
        0.0, description="Overall retrieval confidence score (0.0 to 1.0)."
    )


def _get_cache_key(query: str, filters: Optional[Dict[str, Any]], top_k: int) -> str:
    """Generate cache key for retrieval query."""
    raw = f"{query.strip().lower()}:{json.dumps(filters or {}, sort_keys=True)}:{top_k}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def retrieve_context(
    query: str,
    top_k: Optional[int] = None,
    search_k: Optional[int] = None,
    filters: Optional[Dict[str, Any]] = None,
) -> RetrievalResult:
    """
    Retrieve relevant document chunks, rerank top matches, score confidence, and build context.

    Args:
        query: User search question string.
        top_k: Number of final top chunks to include in context (default FINAL_TOP_K = 5).
        search_k: Number of candidate chunks to fetch initially (default SEARCH_TOP_K = 15).
        filters: Optional metadata filters (e.g. {"document_id": "doc123", "subject": "CS"}).

    Returns:
        RetrievalResult object with matching chunks, confidence metrics, and context.

    Raises:
        ValueError: If query string is empty or invalid.
        RetrievalError: If embedding generation or vector search fails.
    """
    start_time = time.perf_counter()

    if not isinstance(query, str) or not query.strip():
        logger.error("Invalid search query provided to retrieve_context: %r", query)
        raise ValueError("Query must be a non-empty string.")

    cleaned_query = query.strip()
    target_final_k = top_k or FINAL_TOP_K
    target_search_k = search_k or SEARCH_TOP_K

    cache_key = _get_cache_key(cleaned_query, filters, target_final_k)
    if ENABLE_CACHE and cache_key in _RETRIEVAL_CACHE:
        logger.info("Cache hit for query retrieval: '%s'", cleaned_query[:40])
        cached_res: RetrievalResult = _RETRIEVAL_CACHE[cache_key]
        return cached_res

    logger.info(
        "Starting 2-stage retrieval for query: '%s' (fetch_k=%d, final_k=%d)...",
        cleaned_query,
        target_search_k,
        target_final_k,
    )

    # Step 1: Query Embedding
    try:
        embed_start = time.perf_counter()
        query_vec = embed_query(cleaned_query)
        embed_ms = (time.perf_counter() - embed_start) * 1000.0
        logger.debug("Query vector generated in %.2f ms.", embed_ms)
    except Exception as exc:
        logger.exception("Failed to generate query embedding for retrieval: %s", str(exc))
        raise RetrievalError(f"Embedding generation failed for query: {exc}") from exc

    # Step 2: Vector Search (Fetch search_k candidates)
    try:
        search_start = time.perf_counter()
        raw_results = similarity_search(
            query_embedding=query_vec,
            top_k=target_search_k,
            filters=filters,
        )
        search_ms = (time.perf_counter() - search_start) * 1000.0
        logger.debug("Vector search retrieved %d candidate chunks in %.2f ms.", len(raw_results), search_ms)
    except Exception as exc:
        logger.exception("Vector similarity search failed for retrieval: %s", str(exc))
        raise RetrievalError(f"Vector search failed for query: {exc}") from exc

    # Step 3: Rerank & Filter Bad Matches
    scored_candidates = []
    seen_chunk_ids = set()
    seen_contents = set()

    for res in raw_results:
        # Cosine distance in Chroma: similarity score S = 1.0 - distance
        sim_score = round(max(0.0, min(1.0, 1.0 - res.distance)), 4)

        if sim_score < MIN_SIMILARITY_SCORE:
            continue

        if res.chunk_id in seen_chunk_ids:
            continue

        norm_content = res.content.strip()
        if norm_content in seen_contents:
            continue

        seen_chunk_ids.add(res.chunk_id)
        seen_contents.add(norm_content)
        scored_candidates.append((sim_score, res))

    # Sort by similarity score descending
    scored_candidates.sort(key=lambda item: item[0], reverse=True)

    # Take top FINAL_TOP_K candidates
    final_candidates = scored_candidates[:target_final_k]
    final_results = [res for _, res in final_candidates]
    similarity_scores = [score for score, _ in final_candidates]

    highest_sim = max(similarity_scores) if similarity_scores else 0.0
    avg_sim = round(sum(similarity_scores) / len(similarity_scores), 4) if similarity_scores else 0.0
    overall_confidence = round((highest_sim * 0.6) + (avg_sim * 0.4), 4)

    # Step 4: Build Formatted Context String
    formatted_blocks: List[str] = []
    accumulated_chars = 0
    delimiter = "\n\n--------------------------------------------------\n\n"

    for idx, res in enumerate(final_results, start=1):
        doc_id = res.document_id or res.metadata.get("document_id") or "N/A"
        heading = res.metadata.get("heading") or "N/A"
        page = res.metadata.get("page_start") or res.metadata.get("page") or "N/A"
        content = res.content.strip()

        block_str = (
            f"[Chunk {idx}]\n"
            f"Document: {doc_id}\n"
            f"Heading: {heading}\n"
            f"Page: {page}\n"
            f"Content:\n{content}"
        )

        additional_len = len(block_str) + (len(delimiter) if formatted_blocks else 0)
        if accumulated_chars + additional_len > MAX_CONTEXT_CHARS:
            logger.info("Context length cap (%d chars) reached. Stopping at chunk %d.", MAX_CONTEXT_CHARS, idx - 1)
            break

        formatted_blocks.append(block_str)
        accumulated_chars += additional_len

    context_str = delimiter.join(formatted_blocks)
    final_chunks = final_results[: len(formatted_blocks)]
    total_elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    retrieval_res = RetrievalResult(
        query=cleaned_query,
        query_embedding=query_vec,
        results=final_chunks,
        context=context_str,
        retrieval_time_ms=total_elapsed_ms,
        chunk_count=len(final_chunks),
        highest_similarity=highest_sim,
        average_similarity=avg_sim,
        overall_confidence=overall_confidence,
    )

    if ENABLE_CACHE:
        if len(_RETRIEVAL_CACHE) >= _CACHE_MAX_ENTRIES:
            _RETRIEVAL_CACHE.pop(next(iter(_RETRIEVAL_CACHE)))
        _RETRIEVAL_CACHE[cache_key] = retrieval_res

    logger.info(
        "Retrieval finished in %.2f ms. Chunks: %d, Confidence: %.2f (highest: %.2f, avg: %.2f).",
        total_elapsed_ms,
        len(final_chunks),
        overall_confidence,
        highest_sim,
        avg_sim,
    )

    return retrieval_res
