"""
Authentication API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import secrets

from app.models.database import get_db, User

router = APIRouter()
security = HTTPBasic()

# Simple session storage (in production, use Redis or database)
sessions = {}  # {session_token: {user_id: int, username: str, expires: datetime}}


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    session_token: Optional[str] = None
    username: Optional[str] = None
    user_id: Optional[int] = None
    message: Optional[str] = None


def get_current_user(credentials: HTTPBasicCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    """
    Dependency to get current authenticated user from session token.
    The session token should be passed via HTTP Basic Auth username field.
    """
    session_token = credentials.username

    # Check if session exists and is valid
    if session_token not in sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Basic"},
        )

    session = sessions[session_token]
    if session['expires'] < datetime.utcnow():
        del sessions[session_token]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
            headers={"WWW-Authenticate": "Basic"},
        )

    # Get user from database
    user = db.query(User).filter(User.id == session['user_id']).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Basic"},
        )

    return user


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and create session."""
    user = db.query(User).filter(User.username == request.username).first()

    if not user or not user.verify_password(request.password):
        return LoginResponse(success=False, message="Invalid username or password")

    if not user.is_active:
        return LoginResponse(success=False, message="Account is inactive")

    # Create session token
    session_token = secrets.token_urlsafe(32)
    sessions[session_token] = {
        'user_id': user.id,
        'username': user.username,
        'expires': datetime.utcnow() + timedelta(days=30)  # 30 day session
    }

    return LoginResponse(
        success=True,
        session_token=session_token,
        username=user.username,
        user_id=user.id
    )


@router.post("/register", response_model=LoginResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        return LoginResponse(success=False, message="Username already exists")

    # Validate password length
    if len(request.password) < 4:
        return LoginResponse(success=False, message="Password must be at least 4 characters")

    # Create new user
    new_user = User(
        username=request.username,
        password_hash=User.hash_password(request.password),
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Auto-login: create session token
    session_token = secrets.token_urlsafe(32)
    sessions[session_token] = {
        'user_id': new_user.id,
        'username': new_user.username,
        'expires': datetime.utcnow() + timedelta(days=30)
    }

    return LoginResponse(
        success=True,
        session_token=session_token,
        username=new_user.username,
        user_id=new_user.id,
        message="Registration successful"
    )


@router.post("/logout")
def logout(credentials: HTTPBasicCredentials = Depends(security)):
    """Logout user and destroy session."""
    session_token = credentials.username
    if session_token in sessions:
        del sessions[session_token]
    return {"success": True, "message": "Logged out successfully"}


@router.get("/me")
def get_current_user_info(user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return {
        "user_id": user.id,
        "username": user.username,
        "created_at": user.created_at
    }
