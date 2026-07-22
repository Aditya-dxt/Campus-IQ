from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StudyMaterialCreate(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=255,
    )

    description: str | None = None

    subject: str = Field(
        min_length=2,
        max_length=100,
    )


class StudyMaterialUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    subject: str | None = None


class StudyMaterialResponse(BaseModel):
    id: UUID
    title: str
    description: str | None
    subject: str

    file_name: str
    file_type: str
    file_size: int

    is_active: bool

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)