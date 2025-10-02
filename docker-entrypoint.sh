#!/bin/bash
set -e

echo "Starting Distill Webhook Visualizer..."

# Start alert daemon in background
echo "Starting alert daemon..."
python alert_daemon.py &
DAEMON_PID=$!
echo "Alert daemon started with PID $DAEMON_PID"

# Start FastAPI server in foreground
echo "Starting FastAPI server..."
exec python main.py
