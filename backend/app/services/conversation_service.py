"""
Conversation History Service for CampusIQ RAG Pipeline.

Stores and manages conversation turns, providing chat memory formatted for chatbot_ai.py.
"""

from datetime import datetime, timezone
import logging
import threading
from typing import Any, Dict, List, Optional
import uuid

from app.schemas.rag import ConversationResponse

# Set up module logger
logger = logging.getLogger(__name__)

# Thread-safe in-memory conversation store
_CONVERSATION_STORE: Dict[str, Dict[str, Any]] = {}
_STORE_LOCK = threading.Lock()


def save_chat_turn(
    conversation_id: Optional[str],
    user_id: Optional[str],
    question: str,
    answer: str,
    sources: Optional[List[Any]] = None,
) -> str:
    """
    Save a user question and assistant answer turn into conversation history.
    """
    session_id = conversation_id or f"conv_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    source_dicts = [s.model_dump() if hasattr(s, "model_dump") else s for s in (sources or [])]

    user_msg = {"role": "user", "content": question, "timestamp": now_iso}
    assistant_msg = {
        "role": "assistant",
        "content": answer,
        "sources": source_dicts,
        "timestamp": now_iso,
    }

    with _STORE_LOCK:
        if session_id not in _CONVERSATION_STORE:
            _CONVERSATION_STORE[session_id] = {
                "conversation_id": session_id,
                "user_id": str(user_id) if user_id else None,
                "created_at": now_iso,
                "messages": [],
            }

        _CONVERSATION_STORE[session_id]["messages"].extend([user_msg, assistant_msg])

    logger.debug("Saved chat turn to conversation '%s'. Total messages: %d", session_id, len(_CONVERSATION_STORE[session_id]["messages"]))
    return session_id


def get_chat_history(conversation_id: str, max_turns: int = 6) -> List[Dict[str, str]]:
    """
    Retrieve formatted message list for memory injection into LLM prompts.
    """
    with _STORE_LOCK:
        record = _CONVERSATION_STORE.get(str(conversation_id))

    if not record:
        return []

    messages = record.get("messages", [])
    recent = messages[-max_turns * 2 :]
    return [{"role": m["role"], "content": m["content"]} for m in recent]


def list_conversations(user_id: Optional[str] = None) -> List[ConversationResponse]:
    """
    List conversations for a user.
    """
    with _STORE_LOCK:
        records = list(_CONVERSATION_STORE.values())

    results = []
    for rec in records:
        if user_id and rec.get("user_id") and rec.get("user_id") != str(user_id):
            continue
        results.append(
            ConversationResponse(
                conversation_id=rec["conversation_id"],
                created_at=rec["created_at"],
                message_count=len(rec.get("messages", [])),
                messages=rec.get("messages"),
            )
        )

    results.sort(key=lambda c: c.created_at, reverse=True)
    return results


def get_conversation(conversation_id: str, user_id: Optional[str] = None) -> Optional[ConversationResponse]:
    """
    Get full conversation details by ID.
    """
    conv_key = str(conversation_id)
    with _STORE_LOCK:
        rec = _CONVERSATION_STORE.get(conv_key)

    if not rec:
        return None

    if user_id and rec.get("user_id") and rec.get("user_id") != str(user_id):
        return None

    return ConversationResponse(
        conversation_id=rec["conversation_id"],
        created_at=rec["created_at"],
        message_count=len(rec.get("messages", [])),
        messages=rec.get("messages"),
    )


def delete_conversation(conversation_id: str, user_id: Optional[str] = None) -> bool:
    """
    Delete a conversation thread.
    """
    conv_key = str(conversation_id)
    with _STORE_LOCK:
        rec = _CONVERSATION_STORE.get(conv_key)
        if not rec:
            return False

        if user_id and rec.get("user_id") and rec.get("user_id") != str(user_id):
            return False

        _CONVERSATION_STORE.pop(conv_key, None)

    logger.info("Deleted conversation thread '%s'.", conversation_id)
    return True
