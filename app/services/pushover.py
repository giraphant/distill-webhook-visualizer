"""
Pushover notification service.
"""

import requests
from typing import Optional


DEFAULT_API_TOKEN = "azGDORePK8gMaC0QOYAMyEEuzJnyUi"  # Default app token

ALERT_LEVELS = {
    'critical': {
        'priority': 2,  # Emergency - requires acknowledgment
        'sound': 'siren',
        'retry': 30,  # Retry every 30 seconds
        'expire': 3600  # Give up after 1 hour
    },
    'high': {
        'priority': 1,  # High priority
        'sound': 'persistent'
    },
    'medium': {
        'priority': 0,  # Normal
        'sound': 'pushover'
    },
    'low': {
        'priority': -1,  # Low - no sound
        'sound': 'none'
    }
}


def send_pushover_notification(
    user_key: str,
    message: str,
    title: str = "Monitor Alert",
    level: str = 'medium',
    api_token: Optional[str] = None,
    url: Optional[str] = None
) -> bool:
    """
    Send a Pushover notification.

    Args:
        user_key: Pushover user key
        message: Notification message
        title: Notification title
        level: Alert level (critical, high, medium, low)
        api_token: Optional API token (uses default if not provided)
        url: Optional URL to include in notification

    Returns:
        True if notification was sent successfully, False otherwise
    """
    if not user_key:
        print("[Pushover] No user key configured")
        return False

    token = api_token or DEFAULT_API_TOKEN
    config = ALERT_LEVELS.get(level, ALERT_LEVELS['medium'])

    payload = {
        'token': token,
        'user': user_key,
        'message': message,
        'title': title,
        'priority': config['priority'],
        'sound': config['sound']
    }

    # Add retry/expire for critical alerts
    if level == 'critical':
        payload['retry'] = config.get('retry', 30)
        payload['expire'] = config.get('expire', 3600)

    # Add URL if provided
    if url:
        payload['url'] = url
        payload['url_title'] = "View Dashboard"

    try:
        response = requests.post(
            'https://api.pushover.net/1/messages.json',
            data=payload,
            timeout=10
        )

        if response.status_code == 200:
            print(f"[Pushover] Notification sent successfully: {title}")
            return True
        else:
            print(f"[Pushover] Failed to send notification: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"[Pushover] Error sending notification: {e}")
        return False


def format_alert_message(
    monitor_name: str,
    current_value: float,
    threshold_upper: Optional[float],
    threshold_lower: Optional[float],
    unit: Optional[str],
    tags: Optional[list[str]] = None
) -> str:
    """
    Format an alert message for Pushover.

    Args:
        monitor_name: Name of the monitor
        current_value: Current value
        threshold_upper: Upper threshold (if breached)
        threshold_lower: Lower threshold (if breached)
        unit: Unit of measurement
        tags: Optional tags for the monitor

    Returns:
        Formatted message string
    """
    value_str = f"{current_value:,.2f}"
    if unit:
        value_str += f" {unit}"

    if threshold_upper is not None and current_value > threshold_upper:
        threshold_str = f"{threshold_upper:,.2f}"
        if unit:
            threshold_str += f" {unit}"
        reason = f"Above threshold: {threshold_str}"
    elif threshold_lower is not None and current_value < threshold_lower:
        threshold_str = f"{threshold_lower:,.2f}"
        if unit:
            threshold_str += f" {unit}"
        reason = f"Below threshold: {threshold_str}"
    else:
        reason = "Threshold exceeded"

    message = f"Current: {value_str}\n{reason}"

    if tags:
        message += f"\nTags: {', '.join(tags)}"

    return message
