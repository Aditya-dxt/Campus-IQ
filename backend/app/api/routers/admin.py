from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.admin_dependencies import get_current_admin
from app.db.dependencies import get_db
from app.models.user import User
from app.schemas.admin import AdminDashboardResponse
from app.schemas.admin_user import (
    AdminUserResponse,
    UpdateUserRole,
)
from app.services import (
    admin_service,
    admin_user_service,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse,
)
def admin_dashboard(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return admin_service.get_dashboard(db)


@router.get(
    "/users",
    response_model=list[AdminUserResponse],
)
def get_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return admin_user_service.get_all_users(db)


@router.get(
    "/users/{user_id}",
    response_model=AdminUserResponse,
)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        return admin_user_service.get_user(
            db=db,
            user_id=user_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserResponse,
)
def update_user_role(
    user_id: UUID,
    role_data: UpdateUserRole,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        user = admin_user_service.get_user(
            db=db,
            user_id=user_id,
        )

        return admin_user_service.update_role(
            db=db,
            user=user,
            role=role_data.role,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
    )

@router.patch(
    "/users/{user_id}/activate",
    response_model=AdminUserResponse,
)
def activate_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        user = admin_user_service.get_user(
            db=db,
            user_id=user_id,
        )

        return admin_user_service.activate_user(
            db=db,
            user=user,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.patch(
    "/users/{user_id}/deactivate",
    response_model=AdminUserResponse,
)
def deactivate_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        user = admin_user_service.get_user(
            db=db,
            user_id=user_id,
        )

        return admin_user_service.deactivate_user(
            db=db,
            user=user,
            current_admin=admin,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )