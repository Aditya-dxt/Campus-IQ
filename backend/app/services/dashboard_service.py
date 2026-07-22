from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.models.user import User


def get_dashboard(db: Session, current_user: User):
    resume = (
        db.query(Resume)
        .filter(
            Resume.user_id == current_user.id,
            Resume.is_active == True,
        )
        .first()
    )

    return {
        "student": {
            "id": str(current_user.id),
            "full_name": current_user.full_name,
            "email": current_user.email,
        },
        "resume": {
            "uploaded": resume is not None,
            "analysis_status": resume.analysis_status if resume else None,
        },
        "predictor": {
            "status": "pending",
        },
        "chatbot": {
            "status": "available",
        },
        "scheduler": {
            "status": "pending",
        },
    }