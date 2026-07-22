from pydantic import BaseModel


class StudentInfo(BaseModel):
    id: str
    full_name: str
    email: str


class ResumeSummary(BaseModel):
    uploaded: bool
    analysis_status: str | None = None


class PredictorSummary(BaseModel):
    status: str


class ChatbotSummary(BaseModel):
    status: str


class SchedulerSummary(BaseModel):
    status: str


class DashboardResponse(BaseModel):
    student: StudentInfo
    resume: ResumeSummary
    predictor: PredictorSummary
    chatbot: ChatbotSummary
    scheduler: SchedulerSummary