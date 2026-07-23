# CampusIQ Backend Handover

## Project Overview
The CampusIQ backend is a production-grade FastAPI application powering intelligent study material management, high-performance Unlimited-OCR document processing, semantic markdown chunking, vector embedding generation, persistent vector search via ChromaDB, and grounded Retrieval-Augmented Generation (RAG) chat Q&A using Groq's LLaMA 3.3 70B model.

The architecture follows a clean layered design:
- **Presentation Layer**: FastAPI routers handling HTTP requests, OpenAPI documentation, validation, and authorization.
- **Service Layer**: Business logic for document tracking, background task scheduling, conversation persistence, and RAG orchestration.
- **AI Core Pipeline**: Decoupled, modular services for document parsing (`parser.py`), semantic chunking (`chunker.py`), sentence embedding generation (`embeddings.py`), vector database operations (`vector_store.py`), two-stage retrieval and reranking (`retriever.py`), prompt engineering (`prompts.py`), and LLM provider integration (`llm_provider.py`).
- **Data Layer**: SQLAlchemy ORM for relational user/material records, ChromaDB for vector embeddings, and local disk for uploaded files.

---

## Folder Structure

```
backend/
├── app/
│   ├── api/                  # FastAPI endpoints and HTTP route definitions
│   │   ├── dependencies.py   # Auth dependencies (JWT validation, current user)
│   │   └── routers/          # Endpoint routers
│   │       ├── admin.py       # Admin management endpoints
│   │       ├── analysis.py    # Analytics endpoints
│   │       ├── auth.py        # User authentication (login/register)
│   │       ├── chat.py        # RAG Chat Q&A API (/api/chat)
│   │       ├── conversation.py# Conversation history management (/api/conversations)
│   │       ├── dashboard.py   # Dashboard metrics endpoints
│   │       ├── documents.py   # Document metadata & lifecycle management (/api/documents)
│   │       ├── health.py      # System health & diagnostic endpoints (/api/health)
│   │       ├── resume.py      # Resume parsing endpoints
│   │       ├── study_material.py # Legacy study material endpoints
│   │       └── upload.py      # Non-blocking document upload API (/api/upload)
│   ├── core/                 # Core configuration, security, and exceptions
│   │   ├── config.py         # Central Pydantic Settings management
│   │   ├── exceptions.py     # Application exception hierarchy (CampusIQException)
│   │   └── security.py       # Password hashing (bcrypt) and JWT tokens
│   ├── db/                   # Database connection and ORM base
│   │   ├── base.py           # Declarative Base definition
│   │   ├── dependencies.py   # Database session dependency (get_db)
│   │   └── session.py        # SQLAlchemy engine and session factory
│   ├── models/               # SQLAlchemy ORM models
│   │   ├── user.py           # User database model
│   │   ├── study_material.py # StudyMaterial database model
│   │   └── resume.py         # Resume database model
│   ├── schemas/              # Pydantic data validation schemas
│   │   ├── auth.py           # Authentication schemas
│   │   ├── rag.py            # Upload, Document, Chat, Conversation, Health schemas
│   │   ├── study_material.py # Study material schemas
│   │   └── resume.py         # Resume schemas
│   ├── services/             # Application business logic & AI pipeline
│   │   ├── ai/               # AI Engine Modules (Decoupled RAG Core)
│   │   │   ├── parser.py        # Unlimited-OCR document parser
│   │   │   ├── chunker.py       # Heading-aware semantic markdown chunker
│   │   │   ├── embeddings.py    # SentenceTransformers (all-MiniLM-L6-v2) singleton
│   │   │   ├── vector_store.py  # ChromaDB persistent client wrapper
│   │   │   ├── retriever.py     # Two-stage retriever, reranker & scoring
│   │   │   ├── prompts.py       # Modular prompt builder & token estimator
│   │   │   ├── llm_provider.py  # Groq API provider with exponential backoff
│   │   │   └── chatbot_ai.py    # End-to-End RAG chatbot orchestrator
│   │   ├── ai_indexing_service.py # Background indexing task worker
│   │   ├── conversation_service.py# Conversation history management
│   │   ├── document_service.py    # Document lifecycle & status tracker
│   │   └── auth_service.py        # Authentication service
│   └── utils/                # Utility modules
│       └── file_storage.py   # Disk storage validation, saving, and deletion
├── uploads/                  # Storage directory for uploaded user documents
├── storage/chroma/           # Storage directory for persistent ChromaDB vector store
├── .env                      # Active environment configuration (Git-ignored)
├── .env.example              # Environment template file
├── .gitignore                # Git ignore rules
├── BACKEND_HANDOVER.md       # Comprehensive backend handover documentation
├── README.md                 # Project setup and user guide
└── requirements.txt          # Python dependency specifications
```

---

## Complete API Documentation

### 1. Document Upload Endpoint
- **Endpoint**: `/api/upload`
- **Method**: `POST`
- **Purpose**: Upload document files (PDF, DOCX, TXT, PPTX, Images) for non-blocking background RAG indexing.
- **Authentication Required**: Yes (`Bearer <JWT>`)
- **Request Body**: `multipart/form-data`
  - `file`: `UploadFile` (Required)
  - `title`: `string` (Optional)
  - `subject`: `string` (Optional)
  - `description`: `string` (Optional)
- **Response Body**:
  ```json
  {
    "document_id": "0b0e61f4-22cf-45dd-8c21-e89b3e455e5d",
    "filename": "operating_systems.pdf",
    "status": "INDEXING",
    "message": "File uploaded successfully. Background indexing started."
  }
  ```
- **Status Codes**: `202 Accepted`, `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`
- **Example Request**:
  ```bash
  curl -X POST "http://localhost:8000/api/upload" \
    -H "Authorization: Bearer <JWT_TOKEN>" \
    -F "file=@/path/to/os_notes.pdf" \
    -F "subject=Computer Science"
  ```

---

### 2. List Documents Endpoint
- **Endpoint**: `/api/documents`
- **Method**: `GET`
- **Purpose**: Retrieve all uploaded documents belonging to the authenticated user and their current indexing status (`UPLOADING`, `INDEXING`, `READY`, `FAILED`).
- **Authentication Required**: Yes (`Bearer <JWT>`)
- **Request Body**: None
- **Response Body**:
  ```json
  [
    {
      "document_id": "0b0e61f4-22cf-45dd-8c21-e89b3e455e5d",
      "filename": "os_notes.pdf",
      "title": "OS Notes",
      "subject": "Computer Science",
      "status": "READY",
      "upload_time": "2026-07-23T15:10:00Z",
      "pages": 12,
      "chunks": 34,
      "file_size": 245000,
      "file_path": "uploads/study_materials/a7b9c7ef.pdf"
    }
  ]
  ```
- **Status Codes**: `200 OK`, `401 Unauthorized`

---

### 3. Get Document Details Endpoint
- **Endpoint**: `/api/documents/{id}`
- **Method**: `GET`
- **Purpose**: Fetch detailed metadata, page count, and chunk count for a specific document ID.
- **Authentication Required**: Yes (`Bearer <JWT>`)
- **Request Body**: None
- **Response Body**:
  ```json
  {
    "document_id": "0b0e61f4-22cf-45dd-8c21-e89b3e455e5d",
    "filename": "os_notes.pdf",
    "title": "OS Notes",
    "subject": "Computer Science",
    "status": "READY",
    "upload_time": "2026-07-23T15:10:00Z",
    "pages": 12,
    "chunks": 34,
    "file_size": 245000,
    "file_path": "uploads/study_materials/a7b9c7ef.pdf"
  }
  ```
- **Status Codes**: `200 OK`, `401 Unauthorized`, `404 Not Found`

---

### 4. Delete Document Endpoint
- **Endpoint**: `/api/documents/{id}`
- **Method**: `DELETE`
- **Purpose**: Delete local document file, remove document metadata, and erase all associated vector chunks from ChromaDB.
- **Authentication Required**: Yes (`Bearer <JWT>`)
- **Request Body**: None
- **Response Body**:
  ```json
  {
    "message": "Document '0b0e61f4-22cf-45dd-8c21-e89b3e455e5d' deleted successfully."
  }
  ```
- **Status Codes**: `200 OK`, `401 Unauthorized`, `404 Not Found`

---

### 5. RAG Chat Endpoint
- **Endpoint**: `/api/chat`
- **Method**: `POST`
- **Purpose**: Execute grounded study material Q&A using full two-stage RAG retrieval, conversation memory injection, and Groq LLaMA 3.3 70B response generation.
- **Authentication Required**: Yes (`Bearer <JWT>`)
- **Request Body**:
  ```json
  {
    "question": "What is Round Robin CPU scheduling?",
    "conversation_id": "conv_session_101",
    "filters": {
      "subject": "Computer Science"
    }
  }
  ```
- **Response Body**:
  ```json
  {
    "question": "What is Round Robin CPU scheduling?",
    "answer": "Round Robin (RR) CPU scheduling allocates a fixed time quantum (e.g. 10-100ms) to each process in a cyclic order...",
    "conversation_id": "conv_session_101",
    "sources": [
      {
        "document_id": "0b0e61f4-22cf-45dd-8c21-e89b3e455e5d",
        "filename": "os_notes.pdf",
        "page": 4,
        "heading": "Round Robin Scheduling",
        "chunk_id": "doc101_chunk_0004"
      }
    ],
    "overall_confidence": 0.945,
    "retrieval_time_ms": 12.4,
    "llm_time_ms": 115.2,
    "total_time_ms": 127.6
  }
  ```
- **Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`

---

### 6. List Conversations Endpoint
- **Endpoint**: `/api/conversations`
- **Method**: `GET`
- **Purpose**: Retrieve active conversation threads for the authenticated user.
- **Authentication Required**: Yes (`Bearer <JWT>`)
- **Request Body**: None
- **Response Body**:
  ```json
  [
    {
      "conversation_id": "conv_session_101",
      "created_at": "2026-07-23T15:00:00Z",
      "message_count": 4
    }
  ]
  ```
- **Status Codes**: `200 OK`, `401 Unauthorized`

---

### 7. Get Conversation Details Endpoint
- **Endpoint**: `/api/conversations/{id}`
- **Method**: `GET`
- **Purpose**: Retrieve full chat history and turn logs for a conversation thread.
- **Authentication Required**: Yes (`Bearer <JWT>`)
- **Request Body**: None
- **Response Body**:
  ```json
  {
    "conversation_id": "conv_session_101",
    "created_at": "2026-07-23T15:00:00Z",
    "message_count": 2,
    "messages": [
      {
        "role": "user",
        "content": "What is CPU scheduling?",
        "timestamp": "2026-07-23T15:00:00Z"
      },
      {
        "role": "assistant",
        "content": "CPU scheduling allocates execution time to active tasks...",
        "timestamp": "2026-07-23T15:00:01Z"
      }
    ]
  }
  ```
- **Status Codes**: `200 OK`, `401 Unauthorized`, `404 Not Found`

---

### 8. Delete Conversation Endpoint
- **Endpoint**: `/api/conversations/{id}`
- **Method**: `DELETE`
- **Purpose**: Clear a conversation session thread and erase message history.
- **Authentication Required**: Yes (`Bearer <JWT>`)
- **Request Body**: None
- **Response Body**:
  ```json
  {
    "message": "Conversation 'conv_session_101' deleted successfully."
  }
  ```
- **Status Codes**: `200 OK`, `401 Unauthorized`, `404 Not Found`

---

### 9. Health & System Diagnostics Endpoint
- **Endpoint**: `/api/health`
- **Method**: `GET`
- **Purpose**: Inspect real-time system readiness across sentence-transformers, ChromaDB vector storage, and Groq API. Reports whether system is in `full_rag` or `retrieval_only` mode.
- **Authentication Required**: No
- **Request Body**: None
- **Response Body**:
  ```json
  {
    "status": "healthy",
    "mode": "full_rag",
    "llm": {
      "provider": "Groq",
      "configured": true,
      "available": true,
      "model": "llama-3.3-70b-versatile",
      "mode": "full_rag"
    },
    "components": {
      "embedding_model": true,
      "vector_store": true,
      "llm_provider": true
    }
  }
  ```
- **Status Codes**: `200 OK`

---

## AI Pipeline Architecture

```
Document File -> [Parser] -> Clean Markdown -> [Chunker] -> DocumentChunks -> [Embeddings] -> EmbeddedChunks -> [ChromaDB]
                                                                                                                     |
User Query -> [Retriever] -> 2-Stage Vector Search + Reranking + Confidence Scoring <--------------------------------+
                  |
                  v
[Prompt Builder] -> Grounded System + User Prompt -> [Groq API (LLaMA 3.3 70B)] -> Structured ChatResponse
```

1. **Parser (`parser.py`)**: Converts uploaded PDFs, DOCX, TXT, PPTX, and image files into clean structured Markdown with OCR confidence metrics and page markers (`<!-- PAGE X -->`).
2. **Chunker (`chunker.py`)**: Splits Markdown using heading hierarchy (`heading_path`), page ranges (`page_start`/`page_end`), sentence-transformer tokenizer token counting, atomic block preservation (tables, code blocks, math equations), and recursive paragraph splitting.
3. **Embeddings (`embeddings.py`)**: Generates 384-dimensional dense vector embeddings using `sentence-transformers/all-MiniLM-L6-v2` loaded via a thread-safe singleton.
4. **Vector Store (`vector_store.py`)**: Wraps ChromaDB `PersistentClient` to index `EmbeddedChunk` objects in collection `campusiq_documents` with HNSW cosine similarity.
5. **Retriever (`retriever.py`)**: Performs two-stage search (fetching `SEARCH_TOP_K=15`, reranking, filtering low similarity matches `< 0.2`, taking top `FINAL_TOP_K=5`), deduplicating content, and computing confidence metrics (`overall_confidence`, `highest_similarity`, `average_similarity`).
6. **Prompt Builder (`prompts.py`)**: Assembles modular identity, behavioral grounding rules, citation constraints, and recent conversation history memory.
7. **Groq Provider (`llm_provider.py`)**: Executes chat completions using LLaMA 3.3 70B with exponential backoff retries for transient errors.

---

## Background Indexing Flow

1. Client sends `POST /api/upload`.
2. File extension and size are validated. File is saved locally to `uploads/study_materials/`.
3. Document is registered in memory/DB with status `UPLOADING` -> updated immediately to `INDEXING`.
4. FastAPI returns `202 Accepted` response to client immediately without blocking.
5. `FastAPI.BackgroundTasks` runs `background_index_document(document_id, file_path, user_id)`:
   - Invokes `parse_document(file_path)`
   - Invokes `chunk_document(...)`
   - Invokes `embed_document_chunks(...)`
   - Invokes `index_document_chunks(...)`
   - Updates document status to `READY` with `pages` and `chunks` counts (or `FAILED` if errors occur).

---

## Conversation Flow

1. Conversation threads are identified by `conversation_id`.
2. When `POST /api/chat` is called with a `conversation_id`, previous message turns are fetched from `conversation_service`.
3. The last 6 turns (configurable) are formatted into recent conversation history and injected into `build_user_prompt(...)`.
4. After Groq generates the response, both user question and assistant answer are persisted to the conversation thread store.

---

## Configuration Reference

Defined in `app/core/config.py` and configured via `.env`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `APP_NAME` | Application name string | `CampusIQ Backend` |
| `ENVIRONMENT` | Deployment environment | `development` |
| `DATABASE_URL` | SQLAlchemy relational database connection URL | `sqlite:///./campusiq.db` |
| `SECRET_KEY` | JWT signing secret key | `[REQUIRED]` |
| `GROQ_API_KEY` | Groq API Key | `[OPTIONAL for Retrieval-Only]` |
| `GROQ_MODEL` | Groq model identifier | `llama-3.3-70b-versatile` |
| `TEMPERATURE` | LLM generation sampling temperature | `0.2` |
| `MAX_OUTPUT_TOKENS` | Maximum LLM response output tokens | `2048` |
| `CHROMA_DB_PATH` | Local disk storage path for ChromaDB | `./storage/chroma` |
| `CHROMA_COLLECTION_NAME` | ChromaDB vector collection name | `campusiq_documents` |
| `SEARCH_TOP_K` | Candidate chunks fetched in Stage 1 search | `15` |
| `FINAL_TOP_K` | Final top chunks included in RAG context | `5` |
| `MIN_SIMILARITY_SCORE` | Minimum similarity threshold cutoff | `0.2` |
| `MAX_CONTEXT_CHARS` | Maximum character limit for context block | `4000` |

---

## Running the Project

### 1. Setup Virtual Environment
```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# Linux/macOS
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure `.env`
Copy `.env.example` to `.env` and set your variables:
```bash
cp .env.example .env
```

### 4. Run Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```

---

## Production Deployment Notes

1. **Logging**: All logs are handled by standard Python `logging`. Sensitive data (API keys, full prompts, document text) are masked or omitted.
2. **Security**: Ensure `SECRET_KEY` is a strong random 64-character string in production. `.env` is ignored by `.gitignore`.
3. **Retrieval-Only Mode**: If `GROQ_API_KEY` is not supplied, the backend seamlessly operates in Retrieval-Only mode without crashing.
4. **CORS**: Configure `CORSMiddleware` in `app/main.py` when linking frontend domain origins.
5. **Storage**: Mount persistent disk volumes for `uploads/` and `storage/chroma/` in production docker containers.
