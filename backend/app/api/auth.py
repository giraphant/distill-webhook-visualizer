"""
Simple authentication API endpoints.
For a simplified multi-user system where only login is required.
All configurations are shared - only authentication separates users.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.models.database import get_db, User

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    username: Optional[str] = None
    message: Optional[str] = None


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Simple login - just verify username and password."""
    user = db.query(User).filter(User.username == request.username).first()

    if not user or not user.verify_password(request.password):
        return LoginResponse(success=False, message="Invalid username or password")

    if not user.is_active:
        return LoginResponse(success=False, message="Account is inactive")

    return LoginResponse(
        success=True,
        username=user.username,
        message="Login successful"
    )
