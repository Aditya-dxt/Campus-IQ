from datetime import datetime

from pydantic import BaseModel


class ResumeAnalysisResponse(BaseModel):
    status: str
    score: float | None = None
    feedback: str | None = None
    analyzed_at: datetime | None = None