"""
Document Tracking & Management Service for CampusIQ.

Manages document upload registry, indexing status lifecycle (UPLOADING, INDEXING, READY, FAILED),
and document deletion.
"""

from datetime import datetime, timezone
import logging
from pathlib import Path
import threading
from typing import Any, Dict, List, Optional

from app.schemas.rag import DocumentResponse
from app.services.ai.vector_store import delete_document as delete_vector_document
from app.utils.file_storage import delete_file

# Set up module logger
logger = logging.getLogger(__name__)

# Thread-safe in-memory document registry (can be synced to DB)
_DOCUMENT_STORE: Dict[str, Dict[str, Any]] = {}
_STORE_LOCK = threading.Lock()


def register_document(
    document_id: str,
    filename: str,
    file_path: str,
    file_size: int,
    user_id: Optional[str] = None,
    title: Optional[str] = None,
    subject: Optional[str] = None,
) -> DocumentResponse:
    """
    Register a newly uploaded document with status 'UPLOADING'.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "document_id": str(document_id),
        "filename": filename,
        "file_path": file_path,
        "file_size": file_size,
        "user_id": str(user_id) if user_id else None,
        "title": title or filename,
        "subject": subject or "General",
        "status": "UPLOADING",
        "upload_time": now_iso,
        "pages": 0,
        "chunks": 0,
        "error_message": None,
    }

    with _STORE_LOCK:
        _DOCUMENT_STORE[str(document_id)] = record

    logger.info("Registered new document '%s' (%s) for user '%s'.", document_id, filename, user_id or "Anonymous")
    return DocumentResponse(**record)


def update_document_status(
    document_id: str,
    status: str,
    pages: Optional[int] = None,
    chunks: Optional[int] = None,
    error_message: Optional[str] = None,
) -> None:
    """
    Update document indexing status and page/chunk metadata.
    """
    doc_key = str(document_id)
    with _STORE_LOCK:
        if doc_key in _DOCUMENT_STORE:
            _DOCUMENT_STORE[doc_key]["status"] = status
            if pages is not None:
                _DOCUMENT_STORE[doc_key]["pages"] = pages
            if chunks is not None:
                _DOCUMENT_STORE[doc_key]["chunks"] = chunks
            if error_message:
                _DOCUMENT_STORE[doc_key]["error_message"] = error_message
            logger.debug("Updated status for document '%s' -> %s.", document_id, status)


def list_documents(user_id: Optional[str] = None) -> List[DocumentResponse]:
    """
    List all documents, optionally filtered by user_id.
    """
    with _STORE_LOCK:
        records = list(_DOCUMENT_STORE.values())

    results = []
    for rec in records:
        if user_id and rec.get("user_id") and rec.get("user_id") != str(user_id):
            continue
        results.append(DocumentResponse(**rec))

    # Sort most recent first
    results.sort(key=lambda r: r.upload_time, reverse=True)
    return results


def get_document(document_id: str, user_id: Optional[str] = None) -> Optional[DocumentResponse]:
    """
    Retrieve document status record by ID.
    """
    doc_key = str(document_id)
    with _STORE_LOCK:
        rec = _DOCUMENT_STORE.get(doc_key)

    if not rec:
        return None

    if user_id and rec.get("user_id") and rec.get("user_id") != str(user_id):
        return None

    return DocumentResponse(**rec)


def delete_document_record(document_id: str, user_id: Optional[str] = None) -> bool:
    """
    Delete document metadata, remove local file from disk, and remove vectors from ChromaDB.
    """
    doc_key = str(document_id)
    with _STORE_LOCK:
        rec = _DOCUMENT_STORE.get(doc_key)
        if not rec:
            return False

        if user_id and rec.get("user_id") and rec.get("user_id") != str(user_id):
            return False

        file_path = rec.get("file_path")
        _DOCUMENT_STORE.pop(doc_key, None)

    # Clean local file
    if file_path:
        try:
            delete_file(file_path)
        except Exception as exc:
            logger.warning("Error deleting local file '%s': %s", file_path, str(exc))

    # Clean vectors from ChromaDB
    try:
        delete_vector_document(doc_key)
    except Exception as exc:
        logger.warning("Error deleting vector chunks for document '%s': %s", doc_key, str(exc))

    logger.info("Successfully deleted document '%s' and all associated resources.", document_id)
    return True
