"""
Webhook API endpoints for receiving Distill monitoring data.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Dict, Any, Optional
import logging
import json
import os

from app.models.database import (
    MonitoringData,
    DistillWebhookPayload,
    get_db_session
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Get webhook secret from environment variable
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")


def verify_webhook_token(token: Optional[str] = None) -> bool:
    """
    Verify webhook authentication token from URL parameter.

    Args:
        token: Token from URL query parameter (?token=xxx)

    Returns:
        True if token is valid

    Raises:
        HTTPException: If token is missing or invalid
    """
    # If no secret is configured, allow all requests (backward compatibility)
    if not WEBHOOK_SECRET:
        logger.warning("WEBHOOK_SECRET not configured - webhook is not protected!")
        return True

    # Check if token is provided
    if not token:
        logger.warning("Webhook request rejected - missing token parameter")
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token. Please provide ?token=xxx in URL."
        )

    # Verify token matches
    if token != WEBHOOK_SECRET:
        logger.warning(f"Webhook request rejected - invalid token")
        raise HTTPException(
            status_code=403,
            detail="Invalid authentication token"
        )

    return True


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
        # Map Distill fields to our database fields
        monitor_id = payload.id or payload.monitor_id
        monitor_name = payload.name or payload.monitor_name
        url = payload.uri or payload.url
        text_value = payload.text or payload.text_value

        # Try to parse numeric value from text and detect unit
        value = None
        unit = None
        if text_value:
            try:
                # Detect unit from text
                if '%' in text_value:
                    unit = '%'
                elif '$' in text_value:
                    unit = '$'
                elif '€' in text_value:
                    unit = '€'
                elif '£' in text_value:
                    unit = '£'
                # Detect common crypto units
                elif 'SOL' in text_value:
                    unit = 'SOL'
                elif 'ETH' in text_value:
                    unit = 'ETH'
                elif 'BTC' in text_value:
                    unit = 'BTC'

                # Remove commas, percentage signs, currency symbols, and crypto units
                clean_text = text_value.replace(',', '').replace('%', '').replace('$', '').replace('€', '').replace('£', '')
                clean_text = clean_text.replace('SOL', '').replace('ETH', '').replace('BTC', '').strip()

                # Handle k (thousands) and m (millions) suffixes
                multiplier = 1
                if clean_text.lower().endswith('k'):
                    multiplier = 1000
                    clean_text = clean_text[:-1].strip()
                elif clean_text.lower().endswith('m'):
                    multiplier = 1000000
                    clean_text = clean_text[:-1].strip()
                elif clean_text.lower().endswith('b'):
                    multiplier = 1000000000
                    clean_text = clean_text[:-1].strip()

                # Parse as float (handles both positive and negative numbers)
                value = float(clean_text) * multiplier
            except ValueError:
                # If it's not a number, keep it as text only
                logger.debug(f"Could not parse numeric value from: {text_value}")
                value = payload.value

        # Use current timestamp if not provided
        timestamp = datetime.utcnow()
        if payload.timestamp:
            timestamp = parse_timestamp(payload.timestamp)

        # Default status for Distill data
        status = payload.status or "monitored"

        # Create database record
        db_record = MonitoringData(
            monitor_id=monitor_id,
            monitor_name=monitor_name,
            url=url,
            value=value,
            text_value=text_value,
            unit=unit,
            status=status,
            timestamp=timestamp,
            webhook_received_at=datetime.utcnow(),
            is_change=payload.is_change or False,
            change_type=payload.change_type,
            previous_value=payload.previous_value
        )

        db.add(db_record)
        db.commit()
        db.refresh(db_record)

        logger.info(f"Saved monitoring data: monitor_id={monitor_id}, value={value}, text={text_value}")
        return db_record

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error saving monitoring data: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        db.close()


@router.post("/distill-debug")
async def receive_distill_webhook_debug(request: Request) -> Dict[str, Any]:
    """
    Debug endpoint to capture raw Distill webhook payloads.

    This endpoint logs the raw payload to help debug format mismatches.
    """
    try:
        # Get raw body
        body = await request.body()
        raw_payload = body.decode('utf-8')

        # Try to parse as JSON
        try:
            json_payload = json.loads(raw_payload)
            logger.info(f"RAW DISTILL PAYLOAD (JSON): {json.dumps(json_payload, indent=2)}")
        except json.JSONDecodeError:
            logger.info(f"RAW DISTILL PAYLOAD (TEXT): {raw_payload}")

        # Log headers
        headers = dict(request.headers)
        logger.info(f"DISTILL HEADERS: {json.dumps(headers, indent=2)}")

        return {
            "status": "success",
            "message": "Debug payload logged",
            "payload_length": len(raw_payload),
            "content_type": request.headers.get("content-type"),
            "received_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in debug webhook: {e}")
        return {
            "status": "error",
            "message": str(e),
            "received_at": datetime.utcnow().isoformat()
        }


@router.post("/distill")
async def receive_distill_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    token: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """
    Receive webhook data from Distill Web Monitor.

    This endpoint accepts monitoring data from Distill and stores it in the database.
    The data is processed in the background to ensure fast response times.

    **Authentication:**
    Requires ?token=xxx query parameter with the configured secret token.
    """
    # Verify token first
    verify_webhook_token(token)
    try:
        # Get raw body first for debugging
        body = await request.body()
        raw_payload = body.decode('utf-8')

        # Log raw payload and headers for debugging
        headers = dict(request.headers)
        logger.info(f"RAW DISTILL WEBHOOK PAYLOAD: {raw_payload}")
        logger.info(f"DISTILL WEBHOOK HEADERS: {json.dumps(headers, indent=2)}")

        # Try to parse as JSON
        try:
            json_data = json.loads(raw_payload)
            logger.info(f"PARSED JSON PAYLOAD: {json.dumps(json_data, indent=2)}")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

        # Try to validate with Pydantic model
        try:
            payload = DistillWebhookPayload(**json_data)
            logger.info(f"VALIDATED PAYLOAD: {payload.model_dump_json()}")
        except Exception as e:
            logger.error(f"Pydantic validation failed: {e}")
            logger.error(f"Expected fields: monitor_id, url, status, timestamp")
            logger.error(f"Received fields: {list(json_data.keys())}")
            raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")

        # Validate required fields (for Distill format)
        monitor_id = payload.id or payload.monitor_id
        url = payload.uri or payload.url
        text = payload.text or payload.text_value

        if not monitor_id:
            raise HTTPException(status_code=400, detail="id or monitor_id is required")
        if not url:
            raise HTTPException(status_code=400, detail="uri or url is required")
        if not text:
            raise HTTPException(status_code=400, detail="text or text_value is required")

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