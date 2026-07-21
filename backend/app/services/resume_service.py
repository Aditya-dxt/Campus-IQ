from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeCreate, ResumeUpdate


def create_resume(
    db: Session,
    resume_data: ResumeCreate,
    current_user: User,
    file_name: str,
    file_path: str,
    file_type: str,
    file_size: int,
) -> Resume:
    """
    Create a new resume for the authenticated user.
    """

    resume = Resume(
        user_id=current_user.id,
        title=resume_data.title,
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        is_active=True,
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


def get_my_resumes(
    db: Session,
    current_user: User,
) -> list[Resume]:
    """
    Return all resumes owned by the authenticated user.
    """

    resumes = db.scalars(
        select(Resume).where(
            Resume.user_id == current_user.id
        )
    ).all()

    return resumes


def get_resume_by_id(
    db: Session,
    resume_id: UUID,
    current_user: User,
) -> Resume:
    """
    Return a resume if it belongs to the authenticated user.
    """

    resume = db.scalar(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
    )

    if not resume:
        raise ValueError("Resume not found")

    return resume


def update_resume(
    db: Session,
    resume: Resume,
    resume_data: ResumeUpdate,
) -> Resume:
    """
    Update resume details.
    """

    resume.title = resume_data.title

    db.commit()
    db.refresh(resume)

    return resume


def delete_resume(
    db: Session,
    resume: Resume,
) -> None:
    """
    Delete a resume.
    """

    db.delete(resume)
    db.commit()