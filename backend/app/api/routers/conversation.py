"""
Conversation API Router for CampusIQ RAG Backend.

Exposes GET /api/conversations, GET /api/conversations/{id}, and DELETE /api/conversations/{id}.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.rag import ConversationResponse
from app.services import conversation_service

# Set up module logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/conversations",
    tags=["Conversation History"],
)


@router.get(
    "",
    response_model=List[ConversationResponse],
    summary="List all active conversation threads for current user",
)
def list_user_conversations(
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all conversation sessions belonging to the authenticated user.
    """
    return conversation_service.list_conversations(user_id=str(current_user.id))


@router.get(
    "/{id}",
    response_model=ConversationResponse,
    summary="Get detailed message history for a conversation thread",
)
def get_conversation_details(
    id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve full message thread and turn history for a conversation session.
    """
    conv = conversation_service.get_conversation(conversation_id=id, user_id=str(current_user.id))
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID '{id}' not found.",
        )
    return conv


@router.delete(
    "/{id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a conversation thread",
)
def delete_conversation(
    id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Delete a conversation session and clear its history.
    """
    success = conversation_service.delete_conversation(conversation_id=id, user_id=str(current_user.id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID '{id}' not found or permission denied.",
        )
    return {"message": f"Conversation '{id}' deleted successfully."}
