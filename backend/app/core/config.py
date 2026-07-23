from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "CampusIQ Backend"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str
    DIRECT_URL: str

    SECRET_KEY: str

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Groq AI Provider Configuration
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    TEMPERATURE: float = 0.2
    MAX_OUTPUT_TOKENS: int = 2048

    # RAG Vector Store & Retrieval Configuration
    CHROMA_DB_PATH: str = "./storage/chroma"
    CHROMA_COLLECTION_NAME: str = "campusiq_documents"
    DEFAULT_TOP_K: int = 5
    SEARCH_TOP_K: int = 15
    FINAL_TOP_K: int = 5
    MIN_SIMILARITY_SCORE: float = 0.2
    MAX_CONTEXT_CHARS: int = 4000
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()