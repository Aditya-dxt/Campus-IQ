"""
Documents API Router for CampusIQ RAG Backend.

Exposes endpoints to list, retrieve metadata, and delete indexed documents.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.rag import DocumentResponse
from app.services import document_service

# Set up module logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents Management"],
)


@router.get(
    "",
    response_model=List[DocumentResponse],
    summary="List all documents uploaded by current user",
)
def list_user_documents(
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all uploaded documents and their indexing status (UPLOADING, INDEXING, READY, FAILED).
    """
    return document_service.list_documents(user_id=str(current_user.id))


@router.get(
    "/{id}",
    response_model=DocumentResponse,
    summary="Get document details and indexing status",
)
def get_document_details(
    id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve document metadata, pages, chunks count, and status by document ID.
    """
    doc = document_service.get_document(document_id=id, user_id=str(current_user.id))
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{id}' not found.",
        )
    return doc


@router.delete(
    "/{id}",
    status_code=status.HTTP_200_OK,
    summary="Delete document file, metadata, and vector chunks",
)
def delete_document(
    id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Delete a document. Removes the local disk file, deletes vector chunks from ChromaDB,
    and removes document metadata.
    """
    success = document_service.delete_document_record(document_id=id, user_id=str(current_user.id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{id}' not found or permission denied.",
        )
    return {"message": f"Document '{id}' deleted successfully."}
