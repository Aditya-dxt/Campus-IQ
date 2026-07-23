"""
SentenceTransformers Embedding Service for CampusIQ RAG Pipeline.

Generates dense vector embeddings for DocumentChunks and user queries
using sentence-transformers/all-MiniLM-L6-v2.
"""

import logging
import threading
import time
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.core.exceptions import CampusIQException
from app.services.ai.chunker import DocumentChunk

# Set up module logger
logger = logging.getLogger(__name__)

# Safely attempt settings import without breaking test environments
try:
    from app.core.config import settings
    DEFAULT_MODEL_NAME = getattr(
        settings, "EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"
    )
except Exception:
    DEFAULT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

DEFAULT_BATCH_SIZE = 32

# Singleton thread safety
_model_instance: Any = None
_model_lock = threading.Lock()


class EmbeddingError(CampusIQException):
    """Exception raised when vector embedding generation fails."""

    pass


class EmbeddedChunk(BaseModel):
    """
    Represents a DocumentChunk with its corresponding vector embedding.
    Ready for vector database indexing (ChromaDB, Qdrant, PGVector).
    """

    chunk_id: str = Field(..., description="Unique chunk identifier.")
    document_id: Optional[str] = Field(None, description="Source document identifier.")
    embedding: List[float] = Field(..., description="Dense vector embedding list.")
    content: str = Field(..., description="Text content of the chunk.")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata dictionary.")


def _detect_device() -> str:
    """
    Automatically detect best available compute device.

    Priority:
        CUDA -> MPS -> CPU
    """
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
    except ImportError:
        logger.debug("PyTorch not found; defaulting device to CPU.")
    except Exception as exc:
        logger.debug("Device detection error (%s); defaulting to CPU.", str(exc))

    return "cpu"


def load_model(model_name: Optional[str] = None) -> Any:
    """
    Thread-safe singleton model loader for SentenceTransformer.
    Warms up the model after loading to eliminate first-request latency.

    Args:
        model_name: Optional override for model repository name.

    Returns:
        SentenceTransformer model instance.

    Raises:
        EmbeddingError: If sentence-transformers is not installed or fails to load.
    """
    global _model_instance

    if _model_instance is not None:
        return _model_instance

    target_model_name = model_name or DEFAULT_MODEL_NAME

    with _model_lock:
        if _model_instance is None:
            try:
                from sentence_transformers import SentenceTransformer
            except ImportError as err:
                logger.error("sentence-transformers package is missing. Please install sentence-transformers.")
                raise EmbeddingError(
                    "sentence-transformers package is missing from the environment."
                ) from err

            device = _detect_device()
            logger.info(
                "Loading SentenceTransformer model '%s' on device '%s'...",
                target_model_name,
                device,
            )

            start_time = time.perf_counter()
            try:
                model = SentenceTransformer(target_model_name, device=device)

                logger.debug("Warming up embedding model '%s'...", target_model_name)
                model.encode(["CampusIQ embedding warmup query"], show_progress_bar=False)

                load_duration = time.perf_counter() - start_time
                logger.info(
                    "SentenceTransformer model loaded and warmed up successfully in %.2f seconds on %s.",
                    load_duration,
                    device,
                )
                _model_instance = model
            except Exception as exc:
                logger.exception("Failed to load SentenceTransformer model '%s': %s", target_model_name, str(exc))
                raise EmbeddingError(f"Failed to load embedding model: {exc}") from exc

    return _model_instance


def embedding_dimension() -> int:
    """
    Return the vector embedding dimension of the loaded model.

    Returns:
        Embedding dimension integer (e.g. 384 for all-MiniLM-L6-v2).
    """
    model = load_model()
    if hasattr(model, "get_sentence_embedding_dimension"):
        return int(model.get_sentence_embedding_dimension())
    return 384


def embed_document_chunks(
    chunks: List[DocumentChunk],
    batch_size: int = DEFAULT_BATCH_SIZE,
) -> List[EmbeddedChunk]:
    """
    Generate dense vector embeddings for a list of DocumentChunk objects in batches.

    Args:
        chunks: List of DocumentChunk models from the semantic chunker.
        batch_size: Number of chunks per embedding batch (default 32).

    Returns:
        List of EmbeddedChunk models containing vector embeddings and metadata.

    Raises:
        ValueError: If batch_size <= 0.
        EmbeddingError: If model execution fails.
    """
    if not chunks:
        logger.info("Empty chunk list provided to embed_document_chunks. Returning empty list.")
        return []

    if batch_size <= 0:
        logger.error("Invalid batch_size: %d. Batch size must be > 0.", batch_size)
        raise ValueError("batch_size must be a positive integer.")

    valid_chunks: List[DocumentChunk] = []
    texts_to_embed: List[str] = []

    for chunk in chunks:
        if chunk.content and chunk.content.strip():
            valid_chunks.append(chunk)
            texts_to_embed.append(chunk.content)
        else:
            logger.warning("Skipping chunk '%s' due to empty content.", chunk.chunk_id)

    if not valid_chunks:
        logger.warning("No valid text content found among provided chunks.")
        return []

    model = load_model()

    logger.info(
        "Generating embeddings for %d chunks using batch size %d...",
        len(valid_chunks),
        batch_size,
    )

    start_time = time.perf_counter()
    try:
        embeddings = model.encode(
            texts_to_embed,
            batch_size=batch_size,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        elapsed_time = time.perf_counter() - start_time
    except Exception as exc:
        logger.exception("Batch embedding generation failed: %s", str(exc))
        raise EmbeddingError(f"Error generating embeddings for document chunks: {exc}") from exc

    logger.info(
        "Successfully generated embeddings for %d chunks in %.3f seconds (%.2f chunks/sec).",
        len(valid_chunks),
        elapsed_time,
        len(valid_chunks) / elapsed_time if elapsed_time > 0 else 0,
    )

    embedded_chunks: List[EmbeddedChunk] = []
    for chunk, vec in zip(valid_chunks, embeddings):
        vector_list = vec.tolist() if hasattr(vec, "tolist") else list(vec)
        embedded_chunks.append(
            EmbeddedChunk(
                chunk_id=chunk.chunk_id,
                document_id=chunk.document_id,
                embedding=vector_list,
                content=chunk.content,
                metadata=chunk.metadata,
            )
        )

    return embedded_chunks


def embed_query(query: str) -> List[float]:
    """
    Generate dense vector embedding for a single text query string.

    Args:
        query: Search query text string.

    Returns:
        List of floats representing normalized query vector.

    Raises:
        ValueError: If query string is empty or invalid.
        EmbeddingError: If embedding generation fails.
    """
    if not isinstance(query, str) or not query.strip():
        logger.error("Invalid query input for embed_query: %r", query)
        raise ValueError("Query must be a non-empty string.")

    model = load_model()

    logger.debug("Generating query embedding for query string of length %d...", len(query))
    start_time = time.perf_counter()

    try:
        embedding = model.encode(
            query,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        elapsed_time = time.perf_counter() - start_time
        logger.debug("Query embedding completed in %.4f seconds.", elapsed_time)
    except Exception as exc:
        logger.exception("Failed to generate query embedding: %s", str(exc))
        raise EmbeddingError(f"Error generating query embedding: {exc}") from exc

    return embedding.tolist() if hasattr(embedding, "tolist") else list(embedding)
