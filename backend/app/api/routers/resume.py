from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.schemas.resume import ResumeResponse, ResumeUpdate
from app.services import resume_service
from app.utils.file_storage import (
    generate_filename,
    save_file,
    validate_extension,
    validate_file_size,
)

router = APIRouter(
    prefix="/resumes",
    tags=["Resume"],
)


@router.post(
    "",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_resume(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a resume.
    """

    try:
        # Validate file extension
        extension = validate_extension(file.filename)

        # Validate file size
        file_size = validate_file_size(file)

        # Generate unique filename
        filename = generate_filename(extension)

        # Save file inside uploads/resumes/
        file_path = save_file(
            file=file,
            filename=filename,
            folder="resumes",
        )

        # Store metadata in database
        return resume_service.create_resume(
            db=db,
            title=title,
            current_user=current_user,
            file_name=file.filename,
            file_path=file_path,
            file_type=extension,
            file_size=file_size,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=list[ResumeResponse],
)
def get_my_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all resumes uploaded by the current user.
    """
    return resume_service.get_my_resumes(
        db=db,
        current_user=current_user,
    )


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
)
def get_resume(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific resume.
    """
    try:
        return resume_service.get_resume_by_id(
            db=db,
            resume_id=resume_id,
            current_user=current_user,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put(
    "/{resume_id}",
    response_model=ResumeResponse,
)
def update_resume(
    resume_id: UUID,
    resume_data: ResumeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update resume details.
    """
    try:
        resume = resume_service.get_resume_by_id(
            db=db,
            resume_id=resume_id,
            current_user=current_user,
        )

        return resume_service.update_resume(
            db=db,
            resume=resume,
            resume_data=resume_data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_resume(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Soft delete a resume.
    """
    try:
        resume = resume_service.get_resume_by_id(
            db=db,
            resume_id=resume_id,
            current_user=current_user,
        )

        resume_service.delete_resume(
            db=db,
            resume=resume,
        )

        return

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )