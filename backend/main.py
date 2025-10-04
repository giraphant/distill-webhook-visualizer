#!/usr/bin/env python3
"""
Distill Webhook Visualiser
Main application entry point.
"""

import os
import uvicorn
import asyncio
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.webhook import router as webhook_router
from app.api.data import router as data_router
from app.api.alerts import router as alerts_router
from app.api.constants import router as constants_router
from app.api.auth import router as auth_router
from app.api.dex import router as dex_router
from app.models.database import create_tables, get_db_session, User


# Initialize FastAPI app
app = FastAPI(
    title="Distill Webhook Visualiser",
    description="Receive, store, and visualise Distill Web Monitor data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware for frontend access
domain = os.getenv("DOMAIN", "localhost")
cors_origins = os.getenv("CORS_ORIGINS", f"https://{domain},http://localhost:3000,http://127.0.0.1:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates for old HTML pages
templates = Jinja2Templates(directory="templates")

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(webhook_router, prefix="/webhook", tags=["webhooks"])
app.include_router(data_router, prefix="/api", tags=["data"])
app.include_router(alerts_router, prefix="/api", tags=["alerts"])
app.include_router(constants_router, prefix="/api", tags=["constants"])
app.include_router(dex_router, prefix="/api", tags=["dex"])


async def background_cache_warmer():
    """Background task to warm up the DEX funding rates cache every minute."""
    from app.api.dex import get_cached_rates

    # Wait a bit before starting to let the app fully initialize
    await asyncio.sleep(5)

    while True:
        try:
            # Warm up the cache
            await get_cached_rates(force_refresh=True)
            print("✓ DEX funding rates cache refreshed")
        except Exception as e:
            print(f"⚠ Failed to refresh DEX cache: {e}")

        # Wait 60 seconds before next refresh
        await asyncio.sleep(60)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    create_tables()

    # Start background cache warmer task
    asyncio.create_task(background_cache_warmer())

    # Remove formula column if it exists (SQLite migration)
    import sqlite3
    try:
        conn = sqlite3.connect('data/monitoring.db')
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(alert_configs)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'formula' in columns:
            # SQLite doesn't support DROP COLUMN, so recreate the table
            cursor.execute("""
                CREATE TABLE alert_configs_new (
                    monitor_id TEXT PRIMARY KEY,
                    upper_threshold REAL,
                    lower_threshold REAL,
                    alert_level TEXT DEFAULT 'medium',
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                )
            """)
            cursor.execute("""
                INSERT INTO alert_configs_new (monitor_id, upper_threshold, lower_threshold, alert_level, created_at, updated_at)
                SELECT monitor_id, upper_threshold, lower_threshold, alert_level, created_at, updated_at
                FROM alert_configs
            """)
            cursor.execute("DROP TABLE alert_configs")
            cursor.execute("ALTER TABLE alert_configs_new RENAME TO alert_configs")
            conn.commit()
            print("✓ Removed formula column from alert_configs")
        conn.close()
    except Exception as e:
        print(f"Migration note: {e}")

    # Create initial users if no users exist
    db = get_db_session()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            # Get passwords from environment variables
            ramu_pwd = os.getenv("RAMU_PASSWORD", "changeme")
            ligigy_pwd = os.getenv("LIGIGY_PASSWORD", "changeme")
            quasi_pwd = os.getenv("QUASI_PASSWORD", "changeme")

            initial_users = [
                ("ramu", ramu_pwd),
                ("ligigy", ligigy_pwd),
                ("quasi", quasi_pwd)
            ]

            for username, password in initial_users:
                user = User(
                    username=username,
                    password_hash=User.hash_password(password),
                    is_active=True
                )
                db.add(user)

            db.commit()
            print("👤 Created initial users: ramu, ligigy, quasi")
    finally:
        db.close()

    domain = os.getenv("DOMAIN", "localhost")
    port = os.getenv("PORT", "8000")
    protocol = "https" if domain != "localhost" else "http"
    base_url = f"{protocol}://{domain}" if domain != "localhost" else f"http://localhost:{port}"

    print("🚀 Distill Webhook Visualiser started successfully!")
    print(f"📡 Webhook endpoint: {base_url}/webhook/distill")
    print(f"🌐 Dashboard: {base_url}/")
    print(f"📚 API Docs: {base_url}/docs")


# Old HTML template pages (kept for reference)
@app.get("/old", response_class=HTMLResponse)
async def home(request: Request):
    """Home page with overview."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/old/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Dashboard page with data visualization."""
    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.get("/old/deploy", response_class=HTMLResponse)
async def deploy(request: Request):
    """Deploy and management page."""
    return templates.TemplateResponse("deploy.html", {"request": request})


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "distill-webhook-visualiser"}


# Mount static files and serve React app
import os
from fastapi.responses import FileResponse

# Mount the nested static directory from React build
if os.path.exists("static/static"):
    app.mount("/static", StaticFiles(directory="static/static"), name="static")

# Serve React app for specific frontend routes only
@app.get("/", response_class=HTMLResponse)
async def serve_home():
    """Serve React app home page."""
    index_path = "static/index.html"
    if os.path.exists(index_path):
        with open(index_path, "r") as f:
            return f.read()
    return HTMLResponse(content="<h1>App not found</h1>", status_code=404)


if __name__ == "__main__":
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )