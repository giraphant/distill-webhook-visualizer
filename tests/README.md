# Tests

This directory contains test scripts and utilities for the Distill Webhook Visualizer.

## Test Scripts

### test_webhooks.py
Comprehensive webhook testing script that:
- Sends 100 simulated webhook payloads
- Tests various monitor types and data patterns
- Validates API responses
- Measures performance

### test_webhook.py
Simple webhook testing utility for basic functionality verification.

## Usage

### Run Webhook Tests
```bash
# Start the application first
python main.py

# In another terminal, run tests
cd tests
python test_webhooks.py
```

### Custom Test Data
```bash
# Send specific test payload
curl -X POST "http://localhost:8000/webhook/distill" \
  -H "Content-Type: application/json" \
  -d '{
    "monitor_id": "test_monitor",
    "monitor_name": "Test Monitor",
    "url": "https://example.com",
    "value": 42.5,
    "status": "ok",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

## Test Data Patterns

The test scripts simulate various monitoring scenarios:
- E-commerce website monitoring
- API endpoint health checks
- Content change detection
- Performance metrics tracking