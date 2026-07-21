from datetime import datetime

from pydantic import BaseModel


class ResumeAnalysisResponse(BaseModel):
    status: str
    message: str

    model_config = {
        "from_attributes": True
    }