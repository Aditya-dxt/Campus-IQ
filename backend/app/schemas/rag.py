"""
Pydantic Schemas for CampusIQ RAG API Integration.

Defines request/response models for document upload, background indexing,
document management, RAG chat, conversation history, and health status endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    """Response returned immediately upon document upload."""

    document_id: str = Field(..., description="Unique document ID.")
    filename: str = Field(..., description="Original filename uploaded.")
    status: str = Field(..., description="Indexing status (UPLOADING, INDEXING, READY, FAILED).")
    message: str = Field(..., description="User message.")


class DocumentResponse(BaseModel):
    """Detailed document status and metadata response."""

    document_id: str = Field(..., description="Unique document ID.")
    filename: str = Field(..., description="Original filename.")
    title: Optional[str] = Field(None, description="Document title.")
    subject: Optional[str] = Field(None, description="Subject tag.")
    status: str = Field(..., description="Current indexing status (UPLOADING, INDEXING, READY, FAILED).")
    upload_time: str = Field(..., description="Upload timestamp.")
    pages: int = Field(0, description="Total pages extracted.")
    chunks: int = Field(0, description="Total vector chunks indexed.")
    file_size: int = Field(0, description="File size in bytes.")
    file_path: Optional[str] = Field(None, description="Local file storage path.")


class ChatRequest(BaseModel):
    """Request model for RAG Chat interaction."""

    question: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User search query or study question.",
    )
    conversation_id: Optional[str] = Field(
        None,
        description="Optional conversation session ID for chat history memory.",
    )
    filters: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional metadata filters (e.g. {'document_id': 'doc123', 'subject': 'Physics'}).",
    )


class SourceItemSchema(BaseModel):
    """Attributed source information item."""

    document_id: Optional[str] = Field(None, description="Document ID.")
    filename: Optional[str] = Field(None, description="Filename.")
    page: Optional[int] = Field(None, description="Page number.")
    heading: Optional[str] = Field(None, description="Section heading.")
    chunk_id: str = Field(..., description="Unique chunk ID.")


class ChatAPIResponse(BaseModel):
    """Complete RAG Chat response."""

    question: str = Field(..., description="Original question.")
    answer: str = Field(..., description="Generated answer.")
    conversation_id: str = Field(..., description="Active conversation session ID.")
    sources: List[SourceItemSchema] = Field(default_factory=list, description="Source citations.")
    overall_confidence: float = Field(0.0, description="Retrieval confidence score (0.0 to 1.0).")
    retrieval_time_ms: float = Field(..., description="Retrieval latency in ms.")
    llm_time_ms: float = Field(..., description="LLM generation latency in ms.")
    total_time_ms: float = Field(..., description="Total pipeline latency in ms.")


class ConversationResponse(BaseModel):
    """Summary of a conversation thread."""

    conversation_id: str = Field(..., description="Conversation ID.")
    created_at: str = Field(..., description="Creation timestamp.")
    message_count: int = Field(0, description="Total turn count.")
    messages: Optional[List[Dict[str, Any]]] = Field(None, description="Message turn objects.")


class LLMHealthDetails(BaseModel):
    """Detailed LLM Provider Health status."""

    provider: str = Field("Groq", description="LLM Provider name.")
    configured: bool = Field(..., description="True if API Key is configured.")
    available: bool = Field(..., description="True if Groq API is reachable.")
    model: str = Field(..., description="Configured Groq model name.")
    mode: str = Field(..., description="Operating mode ('full_rag' or 'retrieval_only').")


class HealthResponse(BaseModel):
    """RAG System Health Status."""

    status: str = Field(..., description="Overall health status (healthy, degraded, unhealthy).")
    mode: str = Field(..., description="Pipeline mode ('full_rag' or 'retrieval_only').")
    llm: LLMHealthDetails = Field(..., description="LLM provider details.")
    components: Dict[str, bool] = Field(..., description="Component readiness flags.")
