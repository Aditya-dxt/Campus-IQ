"""
Import all SQLAlchemy models here.

Alembic imports this file so that Base.metadata
contains every table in the project.
"""

from app.models.resume import Resume
from app.models.user import User
from app.models.study_material import StudyMaterial

__all__ = [
    "User",
    "Resume",
]