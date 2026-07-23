"""
Background Indexing Task Worker for CampusIQ.

Executes the automated document ingestion pipeline asynchronously:
Parser -> Chunker -> Embeddings -> Vector Store Indexing.
"""

import logging
from typing import Any, Dict, Optional

from app.services.ai.chunker import chunk_document
from app.services.ai.embeddings import embed_document_chunks
from app.services.ai.parser import parse_document
from app.services.ai.vector_store import index_document_chunks
from app.services.document_service import update_document_status

# Set up module logger
logger = logging.getLogger(__name__)


def background_index_document(
    document_id: str,
    file_path: str,
    user_id: Optional[str] = None,
    extra_metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Asynchronous task function to process and index a document in the background.

    Args:
        document_id: Unique identifier string for the document.
        file_path: Local disk path to the uploaded file.
        user_id: Optional ID of the document owner.
        extra_metadata: Optional additional metadata dict.
    """
    logger.info("Background indexing started for document_id '%s'...", document_id)
    update_document_status(document_id, status="INDEXING")

    try:
        # Step 1: Parse Document using Unlimited-OCR
        logger.debug("Step 1/4: Parsing document '%s'...", document_id)
        parse_res = parse_document(file_path)

        # Step 2: Chunk Markdown Document
        logger.debug("Step 2/4: Chunking document '%s'...", document_id)
        chunks = chunk_document(
            markdown=parse_res.markdown,
            document_id=document_id,
            ocr_confidence=parse_res.ocr_confidence,
        )

        if not chunks:
            logger.warning("Document '%s' produced 0 semantic chunks.", document_id)
            update_document_status(
                document_id,
                status="READY",
                pages=parse_res.page_count,
                chunks=0,
            )
            return

        # Inject metadata into chunks
        meta_update = extra_metadata or {}
        if user_id:
            meta_update["user_id"] = str(user_id)

        if meta_update:
            for c in chunks:
                c.metadata.update(meta_update)

        # Step 3: Generate Vector Embeddings
        logger.debug("Step 3/4: Embedding %d chunks for document '%s'...", len(chunks), document_id)
        embedded_chunks = embed_document_chunks(chunks)

        # Step 4: Index into ChromaDB Vector Store
        logger.debug("Step 4/4: Indexing vectors into ChromaDB for document '%s'...", document_id)
        indexed_count = index_document_chunks(embedded_chunks, overwrite=True)

        # Update Document Registry to READY
        update_document_status(
            document_id,
            status="READY",
            pages=parse_res.page_count,
            chunks=indexed_count,
        )
        logger.info(
            "Background indexing completed successfully for document_id '%s' (%d pages, %d chunks).",
            document_id,
            parse_res.page_count,
            indexed_count,
        )

    except Exception as exc:
        logger.exception("Background indexing failed for document_id '%s': %s", document_id, str(exc))
        update_document_status(
            document_id,
            status="FAILED",
            error_message=str(exc),
        )
