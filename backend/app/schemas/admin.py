from pydantic import BaseModel


class AdminDashboardResponse(BaseModel):
    total_users: int
    total_students: int
    total_faculty: int
    total_admins: int

    total_resumes: int
    total_study_materials: int

    pending_resume_analysis: int
    completed_resume_analysis: int