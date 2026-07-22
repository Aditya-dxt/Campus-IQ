from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ResumeCreate(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=255,
        description="Resume title",
        examples=["Software Internship Resume"],
    )


class ResumeUpdate(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=255,
        description="Updated resume title",
        examples=["Backend Resume"],
    )


class ResumeResponse(BaseModel):
    id: UUID
    title: str
    file_name: str
    file_type: str
    file_size: int
    parsed_text: str | None

    # AI Analysis Fields
    ats_score: float | None = None
    analysis_status: str
    analysis_feedback: str | None = None
    analyzed_at: datetime | None = None

    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)