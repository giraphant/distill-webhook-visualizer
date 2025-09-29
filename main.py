#!/usr/bin/env python3
"""
Distill Webhook Visualiser
Main application entry point.
"""

import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.webhook import router as webhook_router
from app.api.data import router as data_router
from app.models.database import create_tables


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

# Mount static files (with check for directory existence)
import os
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Include routers
app.include_router(webhook_router, prefix="/webhook", tags=["webhooks"])
app.include_router(data_router, prefix="/api", tags=["data"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    create_tables()
    domain = os.getenv("DOMAIN", "localhost")
    port = os.getenv("PORT", "8000")
    protocol = "https" if domain != "localhost" else "http"
    base_url = f"{protocol}://{domain}" if domain != "localhost" else f"http://localhost:{port}"

    print("🚀 Distill Webhook Visualiser started successfully!")
    print(f"📡 Webhook endpoint: {base_url}/webhook/distill")
    print(f"🌐 Dashboard: {base_url}/dashboard")
    print(f"📚 API Docs: {base_url}/docs")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page with overview."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Dashboard page with data visualization."""
    return templates.TemplateResponse("dashboard.html", {"request": request})


@app.get("/deploy", response_class=HTMLResponse)
async def deploy(request: Request):
    """Deploy and management page."""
    return templates.TemplateResponse("deploy.html", {"request": request})


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "distill-webhook-visualiser"}


if __name__ == "__main__":
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )