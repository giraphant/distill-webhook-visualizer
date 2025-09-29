#!/usr/bin/env python3
"""
Test script to send sample webhook data to the application.
"""

import requests
import json
import time
from datetime import datetime

WEBHOOK_URL = "http://localhost:8000/webhook/distill"

def test_webhook():
    """Send test webhook data."""
    test_data = {
        "monitor_id": "test_website_1",
        "monitor_name": "Example Website",
        "url": "https://example.com",
        "value": 42.5,
        "status": "changed",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "is_change": True
    }

    try:
        response = requests.post(WEBHOOK_URL, json=test_data, timeout=10)
        response.raise_for_status()

        result = response.json()
        print(f"✅ Success: {result.get('message', 'Data sent successfully')}")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing webhook endpoint...")
    test_webhook()