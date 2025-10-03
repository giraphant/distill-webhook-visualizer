#!/bin/bash
set -e

echo "Starting Distill Webhook Visualizer..."

# Ensure required directories exist and are writable
# This is important when volumes are mounted from the host
echo "Ensuring required directories exist..."
mkdir -p /app/data /app/logs /app/static
chmod 755 /app/data /app/logs /app/static 2>/dev/null || true

# Start alert daemon in background
echo "Starting alert daemon..."
python alert_daemon.py &
DAEMON_PID=$!
echo "Alert daemon started with PID $DAEMON_PID"

# Start FastAPI server in foreground
echo "Starting FastAPI server..."
exec python main.py
