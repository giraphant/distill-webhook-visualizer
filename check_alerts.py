#!/usr/bin/env python3
"""
Alert checking script - runs periodically to check thresholds and send Pushover notifications.
Run this with: python check_alerts.py
Or set up a cron job: */1 * * * * cd /path/to/app && python check_alerts.py
"""

import os
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models.database import (
    SessionLocal,
    MonitoringData,
    AlertConfig,
    AlertState,
    PushoverConfig
)
from app.services.pushover import send_pushover_notification, format_alert_message, ALERT_LEVELS


def get_latest_monitor_values(db: Session) -> dict:
    """Get the latest value for each monitor."""
    monitors = {}

    # Get all unique monitor IDs
    monitor_ids = db.query(MonitoringData.monitor_id).distinct().all()

    for (monitor_id,) in monitor_ids:
        # Get latest record for this monitor
        latest = db.query(MonitoringData).filter(
            MonitoringData.monitor_id == monitor_id
        ).order_by(MonitoringData.timestamp.desc()).first()

        if latest:
            monitors[monitor_id] = latest

    return monitors


def check_threshold(value: float, upper: float = None, lower: float = None) -> bool:
    """Check if value exceeds thresholds."""
    if upper is not None and value > upper:
        return True
    if lower is not None and value < lower:
        return True
    return False


def should_send_notification(
    monitor_id: str,
    alert_level: str,
    db: Session
) -> bool:
    """Check if enough time has passed to send another notification."""
    # Get the most recent active alert for this monitor
    active_alert = db.query(AlertState).filter(
        AlertState.monitor_id == monitor_id,
        AlertState.is_active == True
    ).order_by(AlertState.last_notified_at.desc()).first()

    if not active_alert:
        # No active alert, can send
        return True

    # Check if enough time has passed based on alert level
    level_config = ALERT_LEVELS.get(alert_level, ALERT_LEVELS['medium'])

    # Check interval for each level
    interval_seconds = {
        'critical': 30,   # 30 seconds
        'high': 120,      # 2 minutes
        'medium': 300,    # 5 minutes
        'low': 900        # 15 minutes
    }.get(alert_level, 300)

    time_since_last = datetime.utcnow() - active_alert.last_notified_at
    return time_since_last.total_seconds() >= interval_seconds


def check_alerts():
    """Main function to check all monitors and send alerts."""
    db = SessionLocal()

    try:
        print(f"[{datetime.utcnow()}] Checking alerts...")

        # Get Pushover config
        pushover_config = db.query(PushoverConfig).first()
        if not pushover_config:
            print("[Alert Check] No Pushover configuration found, skipping...")
            return

        # Get all alert configs
        alert_configs = db.query(AlertConfig).all()
        if not alert_configs:
            print("[Alert Check] No alert configurations found")
            return

        # Get latest monitor values
        latest_values = get_latest_monitor_values(db)

        for config in alert_configs:
            monitor_id = config.monitor_id
            latest = latest_values.get(monitor_id)

            if not latest or latest.value is None:
                continue

            # Check if threshold is breached
            is_breached = check_threshold(
                latest.value,
                config.upper_threshold,
                config.lower_threshold
            )

            if is_breached:
                # Check if we should send notification
                if should_send_notification(monitor_id, config.alert_level, db):
                    # Format alert message
                    message = format_alert_message(
                        monitor_name=latest.monitor_name or monitor_id,
                        current_value=latest.value,
                        threshold_upper=config.upper_threshold,
                        threshold_lower=config.lower_threshold,
                        unit=latest.unit,
                        tags=None  # TODO: Load tags from frontend localStorage
                    )

                    # Determine icon based on level
                    icons = {
                        'critical': '🔴',
                        'high': '🟠',
                        'medium': '🟡',
                        'low': '🟢'
                    }
                    icon = icons.get(config.alert_level, '🟡')

                    # Send Pushover notification
                    success = send_pushover_notification(
                        user_key=pushover_config.user_key,
                        message=message,
                        title=f"{icon} {latest.monitor_name or monitor_id} Alert",
                        level=config.alert_level,
                        api_token=pushover_config.api_token,
                        url=os.getenv('DASHBOARD_URL')  # Optional dashboard URL
                    )

                    if success:
                        # Record alert state
                        alert_state = AlertState(
                            monitor_id=monitor_id,
                            alert_level=config.alert_level,
                            triggered_at=datetime.utcnow(),
                            last_notified_at=datetime.utcnow(),
                            notification_count=1,
                            is_active=True
                        )
                        db.add(alert_state)
                        db.commit()

                        print(f"[Alert Check] Sent {config.alert_level} alert for {monitor_id}")
                    else:
                        print(f"[Alert Check] Failed to send alert for {monitor_id}")
                else:
                    print(f"[Alert Check] Skipping {monitor_id} - too soon to notify again")

            else:
                # Value is back to normal - resolve active alerts
                active_alerts = db.query(AlertState).filter(
                    AlertState.monitor_id == monitor_id,
                    AlertState.is_active == True
                ).all()

                for alert in active_alerts:
                    alert.is_active = False
                    alert.resolved_at = datetime.utcnow()
                    print(f"[Alert Check] Resolved alert for {monitor_id}")

                db.commit()

        print("[Alert Check] Check complete")

    except Exception as e:
        print(f"[Alert Check] Error: {e}")
        import traceback
        traceback.print_exc()

    finally:
        db.close()


if __name__ == "__main__":
    check_alerts()
