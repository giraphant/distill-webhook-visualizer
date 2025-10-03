"""
Alert configuration and Pushover integration API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.models.database import (
    AlertConfig,
    PushoverConfig,
    SessionLocal
)

router = APIRouter()


# Pydantic models
class AlertConfigCreate(BaseModel):
    monitor_id: str
    upper_threshold: Optional[float] = None
    lower_threshold: Optional[float] = None
    alert_level: str = 'medium'


class AlertConfigResponse(BaseModel):
    monitor_id: str
    upper_threshold: Optional[float]
    lower_threshold: Optional[float]
    alert_level: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PushoverConfigCreate(BaseModel):
    user_key: str
    api_token: Optional[str] = None


class PushoverConfigResponse(BaseModel):
    user_key: str
    api_token: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True


# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Alert Config endpoints
@router.post("/alerts/config", response_model=AlertConfigResponse)
def create_or_update_alert_config(
    config: AlertConfigCreate,
    db: Session = Depends(get_db)
):
    """Create or update alert configuration for a monitor."""
    existing = db.query(AlertConfig).filter(
        AlertConfig.monitor_id == config.monitor_id
    ).first()

    if existing:
        # Update
        existing.upper_threshold = config.upper_threshold
        existing.lower_threshold = config.lower_threshold
        existing.alert_level = config.alert_level
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create
        new_config = AlertConfig(
            monitor_id=config.monitor_id,
            upper_threshold=config.upper_threshold,
            lower_threshold=config.lower_threshold,
            alert_level=config.alert_level
        )
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        return new_config


@router.get("/alerts/config/{monitor_id}", response_model=Optional[AlertConfigResponse])
def get_alert_config(monitor_id: str, db: Session = Depends(get_db)):
    """Get alert configuration for a specific monitor."""
    config = db.query(AlertConfig).filter(
        AlertConfig.monitor_id == monitor_id
    ).first()
    return config


@router.get("/alerts/configs", response_model=list[AlertConfigResponse])
def get_all_alert_configs(db: Session = Depends(get_db)):
    """Get all alert configurations."""
    configs = db.query(AlertConfig).all()
    return configs


@router.delete("/alerts/config/{monitor_id}")
def delete_alert_config(monitor_id: str, db: Session = Depends(get_db)):
    """Delete alert configuration for a monitor."""
    config = db.query(AlertConfig).filter(
        AlertConfig.monitor_id == monitor_id
    ).first()

    if not config:
        raise HTTPException(status_code=404, detail="Alert config not found")

    db.delete(config)
    db.commit()
    return {"message": "Alert config deleted"}


# Pushover Config endpoints
@router.post("/pushover/config", response_model=PushoverConfigResponse)
def create_or_update_pushover_config(
    config: PushoverConfigCreate,
    db: Session = Depends(get_db)
):
    """Create or update Pushover configuration."""
    existing = db.query(PushoverConfig).first()

    if existing:
        # Update
        existing.user_key = config.user_key
        existing.api_token = config.api_token
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create
        new_config = PushoverConfig(
            user_key=config.user_key,
            api_token=config.api_token
        )
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        return new_config


@router.get("/pushover/config", response_model=Optional[PushoverConfigResponse])
def get_pushover_config(db: Session = Depends(get_db)):
    """Get Pushover configuration."""
    config = db.query(PushoverConfig).first()
    return config


@router.delete("/pushover/config")
def delete_pushover_config(db: Session = Depends(get_db)):
    """Delete Pushover configuration."""
    config = db.query(PushoverConfig).first()

    if not config:
        raise HTTPException(status_code=404, detail="Pushover config not found")

    db.delete(config)
    db.commit()
    return {"message": "Pushover config deleted"}


class PushoverTestRequest(BaseModel):
    user_key: str
    api_token: Optional[str] = None


@router.post("/pushover/test")
def test_pushover_notification(request: PushoverTestRequest):
    """Send a test Pushover notification."""
    from app.services.pushover import send_pushover_notification

    success = send_pushover_notification(
        user_key=request.user_key,
        message="This is a test notification from Distill Webhook Visualizer!",
        title="Test Notification",
        level='medium',
        api_token=request.api_token
    )

    if success:
        return {"message": "Test notification sent successfully!"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test notification")
