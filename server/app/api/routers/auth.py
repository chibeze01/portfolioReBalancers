"""Authentication API endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from ...dependencies import get_db
from ...auth.local_jwt import (
    UserCreate, 
    UserLogin, 
    TokenResponse, 
    register_user, 
    login_user,
    get_current_user_id,
    get_user_by_id,
)


router = APIRouter(prefix="/auth", tags=["auth"])


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None


@router.post("/register", response_model=TokenResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    return register_user(db, user_data)


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password."""
    return login_user(db, credentials)


@router.get("/me", response_model=UserResponse)
def get_current_user(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Get the current authenticated user."""
    user = get_user_by_id(db, user_id)
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
    )
