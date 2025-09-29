"""
Data API endpoints for retrieving and managing monitoring data.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
import json

from app.models.database import (
    MonitoringData,
    MonitoringDataResponse,
    MonitorSummary,
    get_db_session
)

router = APIRouter()


@router.get("/data", response_model=List[MonitoringDataResponse])
async def get_monitoring_data(
    monitor_id: Optional[str] = Query(None, description="Filter by monitor ID"),
    limit: int = Query(100, description="Number of records to return", ge=1, le=1000),
    offset: int = Query(0, description="Number of records to skip", ge=0),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    order_by: str = Query("timestamp", description="Order by field"),
    order_dir: str = Query("desc", description="Order direction (asc/desc)")
) -> List[MonitoringDataResponse]:
    """
    Retrieve monitoring data with optional filtering and pagination.
    """
    db = get_db_session()

    try:
        query = db.query(MonitoringData)

        # Apply filters
        if monitor_id:
            query = query.filter(MonitoringData.monitor_id == monitor_id)

        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(MonitoringData.timestamp >= start_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")

        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                query = query.filter(MonitoringData.timestamp < end_dt)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")

        # Apply ordering
        if hasattr(MonitoringData, order_by):
            order_column = getattr(MonitoringData, order_by)
            if order_dir.lower() == "asc":
                query = query.order_by(asc(order_column))
            else:
                query = query.order_by(desc(order_column))
        else:
            query = query.order_by(desc(MonitoringData.timestamp))

        # Apply pagination
        query = query.offset(offset).limit(limit)

        records = query.all()
        return [MonitoringDataResponse.from_orm(record) for record in records]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        db.close()


@router.get("/monitors", response_model=List[MonitorSummary])
async def get_monitor_summaries() -> List[MonitorSummary]:
    """
    Get summary statistics for all monitors.
    """
    db = get_db_session()

    try:
        # Get monitor summaries with aggregated data
        summaries = db.query(
            MonitoringData.monitor_id,
            MonitoringData.monitor_name,
            MonitoringData.url,
            func.count(MonitoringData.id).label('total_records'),
            func.min(MonitoringData.value).label('min_value'),
            func.max(MonitoringData.value).label('max_value'),
            func.avg(MonitoringData.value).label('avg_value'),
            func.sum(func.cast(MonitoringData.is_change, 'integer')).label('change_count')
        ).group_by(
            MonitoringData.monitor_id,
            MonitoringData.monitor_name,
            MonitoringData.url
        ).all()

        result = []
        for summary in summaries:
            # Get latest record for this monitor
            latest_record = db.query(MonitoringData).filter(
                MonitoringData.monitor_id == summary.monitor_id
            ).order_by(desc(MonitoringData.timestamp)).first()

            result.append(MonitorSummary(
                monitor_id=summary.monitor_id,
                monitor_name=summary.monitor_name,
                url=summary.url,
                total_records=summary.total_records,
                latest_value=latest_record.value if latest_record else None,
                latest_timestamp=latest_record.timestamp if latest_record else datetime.utcnow(),
                min_value=summary.min_value,
                max_value=summary.max_value,
                avg_value=float(summary.avg_value) if summary.avg_value else None,
                change_count=summary.change_count or 0
            ))

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        db.close()


@router.get("/chart-data/{monitor_id}")
async def get_chart_data(
    monitor_id: str,
    days: int = Query(7, description="Number of days to include", ge=1, le=365)
) -> Dict[str, Any]:
    """
    Get chart data for a specific monitor in a format suitable for plotting.
    """
    db = get_db_session()

    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Get data for the specified monitor and date range
        records = db.query(MonitoringData).filter(
            MonitoringData.monitor_id == monitor_id,
            MonitoringData.timestamp >= start_date,
            MonitoringData.timestamp <= end_date
        ).order_by(asc(MonitoringData.timestamp)).all()

        if not records:
            return {
                "monitor_id": monitor_id,
                "data": [],
                "summary": {
                    "total_points": 0,
                    "date_range": f"{start_date.date()} to {end_date.date()}"
                }
            }

        # Format data for charting
        chart_data = []
        for record in records:
            chart_data.append({
                "timestamp": record.timestamp.isoformat(),
                "value": record.value,
                "status": record.status,
                "is_change": record.is_change,
                "url": record.url
            })

        # Calculate summary statistics
        values = [r.value for r in records if r.value is not None]
        summary = {
            "total_points": len(records),
            "date_range": f"{start_date.date()} to {end_date.date()}",
            "value_range": {
                "min": min(values) if values else None,
                "max": max(values) if values else None,
                "avg": sum(values) / len(values) if values else None
            },
            "changes_detected": sum(1 for r in records if r.is_change),
            "latest_value": records[-1].value if records else None,
            "latest_timestamp": records[-1].timestamp.isoformat() if records else None
        }

        return {
            "monitor_id": monitor_id,
            "monitor_name": records[0].monitor_name,
            "url": records[0].url,
            "data": chart_data,
            "summary": summary
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        db.close()


@router.delete("/data/{record_id}")
async def delete_monitoring_record(record_id: int) -> Dict[str, Any]:
    """
    Delete a specific monitoring record.
    """
    db = get_db_session()

    try:
        record = db.query(MonitoringData).filter(MonitoringData.id == record_id).first()

        if not record:
            raise HTTPException(status_code=404, detail="Record not found")

        db.delete(record)
        db.commit()

        return {
            "status": "success",
            "message": f"Record {record_id} deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        db.close()


@router.delete("/monitors/{monitor_id}")
async def delete_monitor_data(monitor_id: str) -> Dict[str, Any]:
    """
    Delete all data for a specific monitor.
    """
    db = get_db_session()

    try:
        deleted_count = db.query(MonitoringData).filter(
            MonitoringData.monitor_id == monitor_id
        ).delete()

        db.commit()

        return {
            "status": "success",
            "message": f"Deleted {deleted_count} records for monitor {monitor_id}"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        db.close()


@router.post("/generate-sample")
async def generate_sample_data() -> Dict[str, Any]:
    """
    Generate sample monitoring data for testing purposes.
    """
    import random
    from datetime import datetime, timedelta

    db = get_db_session()

    try:
        # Generate sample data for multiple monitors
        monitors = [
            {"id": "website_homepage", "name": "Website Homepage", "url": "https://example.com"},
            {"id": "api_status", "name": "API Status", "url": "https://api.example.com/status"},
            {"id": "pricing_page", "name": "Pricing Page", "url": "https://example.com/pricing"},
            {"id": "user_dashboard", "name": "User Dashboard", "url": "https://app.example.com/dashboard"}
        ]

        records_created = 0
        base_time = datetime.utcnow() - timedelta(days=7)

        for monitor in monitors:
            # Generate data points over the last 7 days
            for hour in range(0, 7 * 24, 2):  # Every 2 hours
                timestamp = base_time + timedelta(hours=hour)

                # Generate realistic values with some variation
                base_value = random.uniform(50, 200)
                variation = random.uniform(-20, 20)
                value = round(base_value + variation, 2)

                # Randomly mark some as changes
                is_change = random.random() < 0.1  # 10% chance of change

                record = MonitoringData(
                    monitor_id=monitor["id"],
                    monitor_name=monitor["name"],
                    url=monitor["url"],
                    value=value,
                    status="changed" if is_change else "unchanged",
                    timestamp=timestamp,
                    webhook_received_at=timestamp,
                    is_change=is_change,
                    change_type="increase" if is_change and random.random() > 0.5 else "decrease" if is_change else None
                )

                db.add(record)
                records_created += 1

        db.commit()

        return {
            "status": "success",
            "message": f"Generated {records_created} sample records across {len(monitors)} monitors"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error generating sample data: {str(e)}")
    finally:
        db.close()


@router.delete("/clear-all")
async def clear_all_data() -> Dict[str, Any]:
    """
    Clear all monitoring data from the database.
    """
    db = get_db_session()

    try:
        deleted_count = db.query(MonitoringData).delete()
        db.commit()

        return {
            "status": "success",
            "message": f"Cleared all data: {deleted_count} records deleted"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error clearing data: {str(e)}")
    finally:
        db.close()


@router.post("/execute")
async def execute_command(command_data: Dict[str, str]) -> Dict[str, Any]:
    """
    Execute a system command (for deployment management).
    Note: This is a simplified implementation for demo purposes.
    In production, you should implement proper security and command validation.
    """
    import subprocess
    import shlex

    try:
        command = command_data.get("command", "")

        if not command:
            raise HTTPException(status_code=400, detail="No command provided")

        # For security, only allow specific safe commands
        allowed_commands = [
            "systemctl status",
            "systemctl start",
            "systemctl stop",
            "systemctl restart",
            "git pull",
            "pip install",
            "docker ps",
            "docker images",
            "tail -n 20"
        ]

        # Check if command starts with any allowed prefix
        is_allowed = any(command.startswith(allowed_cmd) for allowed_cmd in allowed_commands)

        if not is_allowed:
            return {
                "success": False,
                "error": "Command not allowed for security reasons",
                "output": ""
            }

        # Execute the command with timeout
        try:
            result = subprocess.run(
                shlex.split(command),
                capture_output=True,
                text=True,
                timeout=30
            )

            return {
                "success": result.returncode == 0,
                "output": result.stdout if result.returncode == 0 else result.stderr,
                "error": result.stderr if result.returncode != 0 else None
            }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Command timed out after 30 seconds",
                "output": ""
            }
        except FileNotFoundError:
            return {
                "success": False,
                "error": f"Command not found: {command.split()[0]}",
                "output": ""
            }

    except Exception as e:
        return {
            "success": False,
            "error": f"Error executing command: {str(e)}",
            "output": ""
        }