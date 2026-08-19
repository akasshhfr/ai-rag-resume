"""
Auth service: handles user registration and login logic.
Keeps business logic out of the router layer.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin
from app.utils.security import hash_password, verify_password, create_access_token


def register_user(db: Session, user_data: UserCreate) -> User:
    """
    Register a new user.

    1. Check if email already exists (prevent duplicates).
    2. Hash the password (never store plain text).
    3. Create and save the User record.
    """
    # Check for existing user
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # Create new user with hashed password
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)  # Reload from DB to get the generated id and created_at
    return user


def authenticate_user(db: Session, user_data: UserLogin) -> str:
    """
    Authenticate a user and return a JWT token.

    1. Find user by email.
    2. Verify password against stored hash.
    3. Create and return a JWT token with user ID as the subject.
    """
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create JWT with user ID as the "sub" (subject) claim
    access_token = create_access_token(data={"sub": str(user.id)})
    return access_token
