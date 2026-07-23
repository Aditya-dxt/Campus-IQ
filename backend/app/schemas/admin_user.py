from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class AdminUserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: UserRole
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class UpdateUserRole(BaseModel):
    role: UserRole