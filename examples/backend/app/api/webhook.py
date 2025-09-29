"""
Webhook API endpoints for receiving Distill monitoring data.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Dict, Any
import logging

from app.models.database import (
    MonitoringData,
    DistillWebhookPayload,
    get_db_session
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


def parse_timestamp(timestamp_str: str) -> datetime:
    """Parse timestamp from various formats."""
    formats = [
        "%Y-%m-%dT%H:%M:%S.%fZ",  # ISO format with microseconds
        "%Y-%m-%dT%H:%M:%SZ",     # ISO format without microseconds
        "%Y-%m-%dT%H:%M:%S",      # ISO format without Z
        "%Y-%m-%d %H:%M:%S",      # Simple format
    ]

    for fmt in formats:
        try:
            return datetime.strptime(timestamp_str, fmt)
        except ValueError:
            continue

    # If all formats fail, use current time
    logger.warning(f"Could not parse timestamp: {timestamp_str}, using current time")
    return datetime.utcnow()


def save_monitoring_data(payload: DistillWebhookPayload) -> MonitoringData:
    """Save monitoring data to database."""
    db = get_db_session()

    try:
        # Parse timestamp
        timestamp = parse_timestamp(payload.timestamp)

        # Create database record
        db_record = MonitoringData(
            monitor_id=payload.monitor_id,
            monitor_name=payload.monitor_name,
            url=payload.url,
            value=payload.value,
            text_value=payload.text_value,
            status=payload.status,
            timestamp=timestamp,
            webhook_received_at=datetime.utcnow(),
            is_change=payload.is_change or False,
            change_type=payload.change_type,
            previous_value=payload.previous_value
        )

        db.add(db_record)
        db.commit()
        db.refresh(db_record)

        logger.info(f"Saved monitoring data: monitor_id={payload.monitor_id}, value={payload.value}")
        return db_record

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error saving monitoring data: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        db.close()


@router.post("/distill")
async def receive_distill_webhook(
    payload: DistillWebhookPayload,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Receive webhook data from Distill Web Monitor.

    This endpoint accepts monitoring data from Distill and stores it in the database.
    The data is processed in the background to ensure fast response times.
    """
    try:
        # Validate required fields
        if not payload.monitor_id:
            raise HTTPException(status_code=400, detail="monitor_id is required")
        if not payload.url:
            raise HTTPException(status_code=400, detail="url is required")
        if not payload.status:
            raise HTTPException(status_code=400, detail="status is required")
        if not payload.timestamp:
            raise HTTPException(status_code=400, detail="timestamp is required")

        # Save data synchronously (for now)
        saved_record = save_monitoring_data(payload)

        return {
            "status": "success",
            "message": "Webhook data received and processed",
            "data": {
                "id": saved_record.id,
                "monitor_id": saved_record.monitor_id,
                "timestamp": saved_record.timestamp.isoformat(),
                "received_at": saved_record.webhook_received_at.isoformat()
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/test")
async def test_webhook(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Test endpoint for webhook functionality.

    Accepts any JSON payload and returns it back with a timestamp.
    Useful for testing webhook integration without storing data.
    """
    return {
        "status": "success",
        "message": "Test webhook received",
        "received_data": data,
        "received_at": datetime.utcnow().isoformat()
    }


@router.get("/status")
async def webhook_status() -> Dict[str, Any]:
    """
    Get webhook service status and statistics.
    """
    db = get_db_session()

    try:
        # Get basic statistics
        total_records = db.query(MonitoringData).count()
        unique_monitors = db.query(MonitoringData.monitor_id).distinct().count()

        # Get latest record
        latest_record = db.query(MonitoringData).order_by(
            MonitoringData.webhook_received_at.desc()
        ).first()

        return {
            "status": "operational",
            "webhook_endpoint": "/webhook/distill",
            "statistics": {
                "total_records": total_records,
                "unique_monitors": unique_monitors,
                "latest_record": latest_record.webhook_received_at.isoformat() if latest_record else None
            }
        }

    except Exception as e:
        logger.error(f"Error getting webhook status: {e}")
        return {
            "status": "error",
            "message": str(e)
        }
    finally:
        db.close()