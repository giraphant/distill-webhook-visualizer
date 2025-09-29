"""
Database models and configuration for Distill webhook data.
"""

import os
from datetime import datetime
from typing import Optional, List
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/monitoring.db")

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class MonitoringData(Base):
    """Database model for storing Distill monitoring data."""

    __tablename__ = "monitoring_data"

    id = Column(Integer, primary_key=True, index=True)
    monitor_id = Column(String, index=True, nullable=False)
    monitor_name = Column(String, nullable=True)
    url = Column(String, nullable=False)
    value = Column(Float, nullable=True)
    text_value = Column(Text, nullable=True)
    status = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    webhook_received_at = Column(DateTime, default=datetime.utcnow)
    is_change = Column(Boolean, default=False)
    change_type = Column(String, nullable=True)
    previous_value = Column(Float, nullable=True)

    def __repr__(self):
        return f"<MonitoringData(monitor_id='{self.monitor_id}', timestamp='{self.timestamp}', value='{self.value}')>"


# Pydantic models for API
class DistillWebhookPayload(BaseModel):
    """Expected payload from Distill webhook."""
    monitor_id: str
    monitor_name: Optional[str] = None
    url: str
    value: Optional[float] = None
    text_value: Optional[str] = None
    status: str
    timestamp: str
    is_change: Optional[bool] = False
    change_type: Optional[str] = None
    previous_value: Optional[float] = None


class MonitoringDataResponse(BaseModel):
    """Response model for monitoring data."""
    id: int
    monitor_id: str
    monitor_name: Optional[str]
    url: str
    value: Optional[float]
    text_value: Optional[str]
    status: str
    timestamp: datetime
    webhook_received_at: datetime
    is_change: bool
    change_type: Optional[str]
    previous_value: Optional[float]

    class Config:
        from_attributes = True


class MonitorSummary(BaseModel):
    """Summary statistics for a monitor."""
    monitor_id: str
    monitor_name: Optional[str]
    url: str
    total_records: int
    latest_value: Optional[float]
    latest_timestamp: datetime
    min_value: Optional[float]
    max_value: Optional[float]
    avg_value: Optional[float]
    change_count: int


def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create database tables."""
    Base.metadata.create_all(bind=engine)


def get_db_session() -> Session:
    """Get a database session (for direct use)."""
    return SessionLocal()