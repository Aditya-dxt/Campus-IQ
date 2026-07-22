from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.auth import UserRegister
from sqlalchemy import select

from app.core.security import (
    create_access_token,
    verify_password,
)


def register_user(
    db: Session,
    user_data: UserRegister,
) -> User:
    """
    Register a new user.
    Raises ValueError if email already exists.
    """

    existing_user = db.scalar(
        select(User).where(User.email == user_data.email)
    )

    if existing_user:
        raise ValueError("Email already registered")

    user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=UserRole.STUDENT,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user
def login_user(
    db: Session,
    email: str,
    password: str,
) -> str:
    """
    Authenticate a user and return a JWT access token.
    """

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if not user:
        raise ValueError("Invalid email or password")

    if not verify_password(
        password,
        user.password_hash,
    ):
        raise ValueError("Invalid email or password")

    token = create_access_token(
        {
            "sub": str(user.id),
        }
    )

    return token