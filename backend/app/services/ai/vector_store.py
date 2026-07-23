"""
ChromaDB Vector Store Service for CampusIQ RAG Pipeline.

Provides persistent vector storage, batch chunk indexing, document deletion,
and similarity search operations for EmbeddedChunk objects.
"""

import json
import logging
from pathlib import Path
import threading
import time
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.core.exceptions import CampusIQException
from app.services.ai.embeddings import EmbeddedChunk, embedding_dimension

# Set up module logger
logger = logging.getLogger(__name__)

# Safely attempt settings import without breaking test environments
try:
    from app.core.config import settings
    DEFAULT_CHROMA_PATH = getattr(settings, "CHROMA_DB_PATH", "./storage/chroma")
    DEFAULT_COLLECTION_NAME = getattr(
        settings, "CHROMA_COLLECTION_NAME", "campusiq_documents"
    )
    DEFAULT_TOP_K = getattr(settings, "DEFAULT_TOP_K", 5)
except Exception:
    DEFAULT_CHROMA_PATH = "./storage/chroma"
    DEFAULT_COLLECTION_NAME = "campusiq_documents"
    DEFAULT_TOP_K = 5


class VectorStoreError(CampusIQException):
    """Exception raised when vector store operations fail."""

    pass


class SearchResult(BaseModel):
    """
    Represents a similarity search result retrieved from ChromaDB.
    Ready for immediate consumption by retriever service.
    """

    chunk_id: str = Field(..., description="Unique chunk identifier.")
    document_id: Optional[str] = Field(None, description="Source document ID.")
    content: str = Field(..., description="Document chunk text content.")
    distance: float = Field(..., description="Similarity distance score.")
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Metadata dictionary."
    )


# Thread-safe singletons
_chroma_client: Any = None
_chroma_collection: Any = None
_store_lock = threading.Lock()


def _get_client() -> Any:
    """
    Thread-safe singleton loader for ChromaDB PersistentClient.
    """
    global _chroma_client

    if _chroma_client is not None:
        return _chroma_client

    with _store_lock:
        if _chroma_client is None:
            db_path = Path(DEFAULT_CHROMA_PATH)
            db_path.mkdir(parents=True, exist_ok=True)

            try:
                import chromadb  # type: ignore

                logger.info(
                    "Initializing ChromaDB PersistentClient at path: '%s'...",
                    db_path.resolve(),
                )
                _chroma_client = chromadb.PersistentClient(path=str(db_path.resolve()))
            except ImportError as err:
                logger.error("chromadb package is missing. Please install chromadb.")
                raise VectorStoreError(
                    "chromadb package is missing from the environment."
                ) from err
            except Exception as exc:
                logger.exception("Failed to initialize ChromaDB client: %s", str(exc))
                raise VectorStoreError(f"Failed to initialize ChromaDB: {exc}") from exc

    return _chroma_client


def get_collection() -> Any:
    """
    Thread-safe singleton retrieval for the main ChromaDB collection.

    Returns:
        ChromaDB Collection instance.

    Raises:
        VectorStoreError: If collection initialization fails.
    """
    global _chroma_collection

    if _chroma_collection is not None:
        return _chroma_collection

    with _store_lock:
        if _chroma_collection is None:
            client = _get_client()
            try:
                logger.info(
                    "Loading or creating ChromaDB collection '%s'...",
                    DEFAULT_COLLECTION_NAME,
                )
                _chroma_collection = client.get_or_create_collection(
                    name=DEFAULT_COLLECTION_NAME,
                    metadata={"hnsw:space": "cosine"},
                )
                logger.info(
                    "ChromaDB collection '%s' loaded successfully.",
                    DEFAULT_COLLECTION_NAME,
                )
            except Exception as exc:
                logger.exception(
                    "Failed to get or create collection '%s': %s",
                    DEFAULT_COLLECTION_NAME,
                    str(exc),
                )
                raise VectorStoreError(
                    f"Failed to access collection '{DEFAULT_COLLECTION_NAME}': {exc}"
                ) from exc

    return _chroma_collection


def check_vector_store_health() -> bool:
    """
    Check health and accessibility of ChromaDB vector store.
    """
    try:
        collection = get_collection()
        collection.count()
        return True
    except Exception as exc:
        logger.warning("Vector store health check failed: %s", str(exc))
        return False


def _prepare_metadata_for_chroma(meta: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert complex metadata types into ChromaDB-compatible primitive values.
    """
    cleaned: Dict[str, Any] = {}
    for key, value in meta.items():
        if value is None:
            continue
        if isinstance(value, (str, int, float, bool)):
            cleaned[key] = value
        elif isinstance(value, (list, dict)):
            cleaned[key] = json.dumps(value)
        else:
            cleaned[key] = str(value)
    return cleaned


def _restore_metadata_from_chroma(meta: Dict[str, Any]) -> Dict[str, Any]:
    """
    Restore serialized JSON strings back to lists/dicts where applicable.
    """
    restored: Dict[str, Any] = {}
    for key, value in meta.items():
        if isinstance(value, str) and (value.startswith("[") or value.startswith("{")):
            try:
                restored[key] = json.loads(value)
                continue
            except Exception:
                pass
        restored[key] = value
    return restored


def document_exists(document_id: str) -> bool:
    """
    Check if any chunks belonging to a document ID exist in vector store.
    """
    if not document_id:
        return False

    try:
        collection = get_collection()
        results = collection.get(
            where={"document_id": document_id},
            limit=1,
            include=[],
        )
        return len(results.get("ids", [])) > 0
    except Exception as exc:
        logger.warning("Failed to check document existence for '%s': %s", document_id, str(exc))
        return False


def delete_document(document_id: str) -> None:
    """
    Delete all vector chunks belonging to a specific document ID.
    """
    if not document_id:
        logger.warning("Empty document_id passed to delete_document. Skipping.")
        return

    collection = get_collection()
    logger.info("Deleting document chunks for document_id: '%s'...", document_id)

    try:
        collection.delete(where={"document_id": document_id})
        logger.info("Successfully deleted vector chunks for document_id: '%s'.", document_id)
    except Exception as exc:
        logger.exception("Failed to delete document chunks for document_id '%s': %s", document_id, str(exc))
        raise VectorStoreError(f"Error deleting document '{document_id}' from vector store: {exc}") from exc


def count_chunks() -> int:
    """
    Return total number of vector chunks indexed in the collection.
    """
    try:
        collection = get_collection()
        return collection.count()
    except Exception as exc:
        logger.exception("Failed to get collection count: %s", str(exc))
        raise VectorStoreError(f"Error counting collection chunks: {exc}") from exc


def index_document_chunks(
    embedded_chunks: List[EmbeddedChunk],
    overwrite: bool = True,
) -> int:
    """
    Batch insert a list of EmbeddedChunk objects into ChromaDB vector store.
    """
    if not embedded_chunks:
        logger.info("Empty embedded_chunks list provided. Skipping indexing.")
        return 0

    collection = get_collection()
    document_ids = {c.document_id for c in embedded_chunks if c.document_id}

    for doc_id in document_ids:
        if document_exists(doc_id):
            if overwrite:
                logger.info("Document '%s' exists. Overwrite enabled -> deleting existing chunks.", doc_id)
                delete_document(doc_id)
            else:
                logger.info("Document '%s' exists. Overwrite disabled -> skipping indexing.", doc_id)
                return 0

    ids: List[str] = []
    embeddings: List[List[float]] = []
    documents: List[str] = []
    metadatas: List[Dict[str, Any]] = []

    for chunk in embedded_chunks:
        ids.append(chunk.chunk_id)
        embeddings.append(chunk.embedding)
        documents.append(chunk.content)
        metadatas.append(_prepare_metadata_for_chroma(chunk.metadata))

    logger.info("Batch indexing %d vector chunks into ChromaDB...", len(ids))
    start_time = time.perf_counter()

    try:
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )
        elapsed_time = time.perf_counter() - start_time
        logger.info("Successfully indexed %d chunks in %.3f seconds.", len(ids), elapsed_time)
        return len(ids)
    except Exception as exc:
        logger.exception("Failed to batch index chunks into ChromaDB: %s", str(exc))
        raise VectorStoreError(f"Error indexing chunks into vector store: {exc}") from exc


def similarity_search(
    query_embedding: List[float],
    top_k: Optional[int] = None,
    filters: Optional[Dict[str, Any]] = None,
) -> List[SearchResult]:
    """
    Perform vector similarity search against the ChromaDB collection.
    """
    if not query_embedding:
        logger.error("Empty query_embedding provided for similarity search.")
        raise ValueError("query_embedding must be a non-empty list of floats.")

    k = top_k or DEFAULT_TOP_K
    collection = get_collection()

    start_time = time.perf_counter()
    try:
        chroma_kwargs: Dict[str, Any] = {
            "query_embeddings": [query_embedding],
            "n_results": k,
            "include": ["documents", "metadatas", "distances"],
        }
        if filters:
            chroma_kwargs["where"] = _prepare_metadata_for_chroma(filters)

        raw_results = collection.query(**chroma_kwargs)
        elapsed_time = time.perf_counter() - start_time

        ids = raw_results.get("ids", [[]])[0]
        docs = raw_results.get("documents", [[]])[0]
        metas = raw_results.get("metadatas", [[]])[0]
        dists = raw_results.get("distances", [[]])[0]

        results: List[SearchResult] = []
        for chunk_id, doc, meta, dist in zip(ids, docs, metas, dists):
            restored_meta = _restore_metadata_from_chroma(meta or {})
            doc_id = restored_meta.get("document_id")

            results.append(
                SearchResult(
                    chunk_id=chunk_id,
                    document_id=doc_id,
                    content=doc,
                    distance=float(dist),
                    metadata=restored_meta,
                )
            )

        logger.debug("Vector similarity search returned %d results in %.4f seconds.", len(results), elapsed_time)
        return results

    except Exception as exc:
        logger.exception("Vector similarity search failed: %s", str(exc))
        raise VectorStoreError(f"Error performing vector similarity search: {exc}") from exc
