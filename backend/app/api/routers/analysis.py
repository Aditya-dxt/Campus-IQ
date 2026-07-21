from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.schemas.analysis import ResumeAnalysisResponse
from app.services import resume_service
from app.services.ai.resume_ai import analyze_resume

router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"],
)
@router.post(
    "/resume/{resume_id}",
    response_model=ResumeAnalysisResponse,
)
def analyze_uploaded_resume(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        resume = resume_service.get_resume_by_id(
            db=db,
            resume_id=resume_id,
            current_user=current_user,
        )

        return analyze_resume(
            resume.parsed_text or ""
        )

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )