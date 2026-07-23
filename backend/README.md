# CampusIQ Backend API & RAG AI Engine

CampusIQ is an AI-powered academic platform featuring a Retrieval-Augmented Generation (RAG) pipeline for university study material ingestion, document vectorization, and grounded chat Q&A.

---

## 📁 Folder Structure Overview

```
backend/
├── app/
│   ├── api/                  # FastAPI endpoints and HTTP route definitions
│   │   └── routers/          # Endpoint routers (upload, documents, chat, conversation, health, auth)
│   ├── core/                 # Core configuration, security, and exceptions
│   ├── db/                   # Database connection and ORM base
│   ├── models/               # SQLAlchemy ORM models (User, StudyMaterial, Resume)
│   ├── schemas/              # Pydantic data validation schemas
│   ├── services/             # Application business logic & AI pipeline
│   │   └── ai/               # AI Engine Core (parser, chunker, embeddings, vector_store, retriever, prompts, llm_provider, chatbot_ai)
│   └── utils/                # File storage and validation helpers
├── uploads/                  # Storage directory for uploaded user documents
├── storage/chroma/           # Storage directory for persistent ChromaDB vector store
├── .env                      # Active environment configuration (Git-ignored)
├── .env.example              # Environment template file
├── BACKEND_HANDOVER.md       # Comprehensive backend handover documentation
└── requirements.txt          # Python dependency specifications
```

---

## 🚀 Installation & Setup Guide

### 1. Prerequisites
- Python 3.10+
- PostgreSQL or SQLite
- Groq API Key (Optional for Full RAG Mode)

### 2. Virtual Environment Setup
```bash
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set your configuration variables:

```env
APP_NAME=CampusIQ Backend
ENVIRONMENT=development

DATABASE_URL=sqlite:///./campusiq.db
DIRECT_URL=sqlite:///./campusiq.db
SECRET_KEY=your-secret-key-here

# Groq AI Provider Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
TEMPERATURE=0.2
MAX_OUTPUT_TOKENS=2048

# RAG Configuration
CHROMA_DB_PATH=./storage/chroma
CHROMA_COLLECTION_NAME=campusiq_documents
DEFAULT_TOP_K=5
SEARCH_TOP_K=15
FINAL_TOP_K=5
MIN_SIMILARITY_SCORE=0.2
MAX_CONTEXT_CHARS=4000
EMBEDDING_MODEL_NAME=sentence-transformers/all-MiniLM-L6-v2
```

---

## 🏃 Running the Application

Start the Uvicorn server:

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation is available at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 RAG API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/upload` | Upload document (PDF, DOCX, TXT, PPTX, Images) for non-blocking background RAG indexing. |
| `GET` | `/api/documents` | List uploaded documents and current indexing status (`UPLOADING`, `INDEXING`, `READY`, `FAILED`). |
| `GET` | `/api/documents/{id}` | Retrieve document metadata, page count, and vector chunk count. |
| `DELETE` | `/api/documents/{id}` | Delete local document file, metadata, and ChromaDB vector embeddings. |
| `POST` | `/api/chat` | Ask study question with conversation memory (`conversation_id`) and metadata filtering. |
| `GET` | `/api/conversations` | List user conversation threads. |
| `GET` | `/api/conversations/{id}` | Retrieve full chat history for a session. |
| `DELETE` | `/api/conversations/{id}` | Clear conversation history thread. |
| `GET` | `/api/health` | Inspect system readiness across Embeddings, ChromaDB, and Groq API. |

---

## 🛠️ Troubleshooting

1. **`GROQ_API_KEY` missing**: The backend automatically switches to **Retrieval-Only Mode** without crashing. Document parsing, chunking, embeddings, vector indexing, and retrieval operate normally.
2. **PyMuPDF (`fitz`) or OCR issues**: Ensure `PyMuPDF` and `sentence-transformers` are installed in your active virtual environment.
3. **Database connection error**: Verify `DATABASE_URL` in `.env` points to a valid database.

For complete architectural and API handover details, see [BACKEND_HANDOVER.md](file:///C:/Users/adity/music/adya/Campus-IQ/backend/BACKEND_HANDOVER.md).
