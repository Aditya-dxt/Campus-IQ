from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.resume import Resume
from app.models.study_material import StudyMaterial
from app.models.user import User, UserRole


def get_dashboard(db: Session):
    return {
        "total_users": db.query(User).count(),

        "total_students": db.query(User).filter(
            User.role == UserRole.STUDENT
        ).count(),

        "total_faculty": db.query(User).filter(
            User.role == UserRole.FACULTY
        ).count(),

        "total_admins": db.query(User).filter(
            User.role == UserRole.ADMIN
        ).count(),

        "total_resumes": db.query(Resume).filter(
            Resume.is_active == True
        ).count(),

        "total_study_materials": db.query(StudyMaterial).filter(
            StudyMaterial.is_active == True
        ).count(),

        "pending_resume_analysis": db.query(Resume).filter(
            Resume.analysis_status == "pending"
        ).count(),

        "completed_resume_analysis": db.query(Resume).filter(
            Resume.analysis_status == "completed"
        ).count(),
    }