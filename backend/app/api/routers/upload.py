"""
Upload API Router for CampusIQ RAG Document Ingestion.

Exposes POST /api/upload to handle file validation, saving, and triggering background indexing.
"""

import logging
from uuid import uuid4

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)

from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.rag import UploadResponse
from app.services.ai_indexing_service import background_index_document
from app.services.document_service import register_document
from app.utils.file_storage import (
    generate_filename,
    save_file,
    validate_extension,
    validate_file_size,
)

# Set up module logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["Document Upload"],
)


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload document for automatic background RAG indexing",
)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str | None = Form(None),
    subject: str | None = Form(None),
    description: str | None = Form(None),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a document (PDF, DOCX, TXT, PPTX, Images) for automated RAG ingestion.
    Validates file size and type, saves to disk, and triggers background indexing.
    """
    logger.info("Upload request received: '%s' from user '%s'", file.filename, current_user.email)

    try:
        ext = validate_extension(file.filename)
        file_size = validate_file_size(file)
        unique_name = generate_filename(ext)

        file_path = save_file(
            file=file,
            filename=unique_name,
            folder="study_materials",
        )

        doc_id = str(uuid4())

        # Register document status as UPLOADING
        doc_resp = register_document(
            document_id=doc_id,
            filename=file.filename,
            file_path=file_path,
            file_size=file_size,
            user_id=str(current_user.id),
            title=title or file.filename,
            subject=subject or "General",
        )

        # Dispatch background indexing task (Non-blocking)
        background_tasks.add_task(
            background_index_document,
            document_id=doc_id,
            file_path=file_path,
            user_id=str(current_user.id),
            extra_metadata={
                "filename": file.filename,
                "subject": subject or "General",
                "title": title or file.filename,
            },
        )

        return UploadResponse(
            document_id=doc_id,
            filename=file.filename,
            status="INDEXING",
            message="File uploaded successfully. Background indexing started.",
        )

    except ValueError as val_err:
        logger.warning("Upload validation failed: %s", str(val_err))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        logger.exception("Upload processing failed: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {exc}",
        )
