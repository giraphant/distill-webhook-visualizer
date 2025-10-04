#!/usr/bin/env python3
"""
Alert daemon - continuously runs alert checks in the background.
This replaces cron and runs alongside the FastAPI server.
"""

import time
import signal
import sys
from datetime import datetime

from check_alerts import check_alerts

# Global flag for graceful shutdown
running = True


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    global running
    print(f"\n[Alert Daemon] Received signal {signum}, shutting down...")
    running = False


def main():
    """Main daemon loop."""
    global running

    # Register signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    print("[Alert Daemon] Starting alert check daemon...")
    print("[Alert Daemon] Will check every 30 seconds")

    while running:
        try:
            print(f"\n[Alert Daemon] Running check at {datetime.now()}")
            check_alerts()
            print("[Alert Daemon] Check complete, waiting 30 seconds...")

            # Sleep but check running flag every second
            for _ in range(30):
                if not running:
                    break
                time.sleep(1)

        except Exception as e:
            print(f"[Alert Daemon] Error in main loop: {e}")
            import traceback
            traceback.print_exc()

            # Wait a bit before retry on error
            time.sleep(10)

    print("[Alert Daemon] Shutdown complete")


if __name__ == "__main__":
    main()
