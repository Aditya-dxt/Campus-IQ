from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user import User, UserRole


def get_all_users(db: Session):
    """
    Get all users.
    """
    return (
        db.query(User)
        .order_by(User.full_name)
        .all()
    )


def get_user(
    db: Session,
    user_id: UUID,
):
    """
    Get a user by ID.
    """
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise ValueError("User not found.")

    return user


def update_role(
    db: Session,
    user: User,
    role: UserRole,
):
    """
    Update a user's role.

    Prevent removing the last admin.
    """

    if (
        user.role == UserRole.ADMIN
        and role != UserRole.ADMIN
    ):
        admin_count = (
            db.query(User)
            .filter(User.role == UserRole.ADMIN)
            .count()
        )

        if admin_count == 1:
            raise ValueError(
                "Cannot remove the last admin."
            )

    user.role = role

    db.commit()
    db.refresh(user)

    return user


def activate_user(
    db: Session,
    user: User,
):
    """
    Activate a user.
    """

    user.is_active = True

    db.commit()
    db.refresh(user)

    return user


def deactivate_user(
    db: Session,
    user: User,
    current_admin: User,
):
    """
    Deactivate a user.

    Prevent an admin from deactivating themselves.
    """

    if user.id == current_admin.id:
        raise ValueError(
            "You cannot deactivate your own account."
        )

    user.is_active = False

    db.commit()
    db.refresh(user)

    return user