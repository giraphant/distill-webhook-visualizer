#!/usr/bin/env python3
"""
Distill Webhook Visualizer
Main application entry point.
"""

import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

from app.api.webhook import router as webhook_router
from app.api.data import router as data_router
from app.models.database import create_tables


# Initialize FastAPI app
app = FastAPI(
    title="Distill Webhook Visualizer",
    description="Receive, store, and visualize Distill Web Monitor data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Mount static files (will be created later)
# app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Include routers
app.include_router(webhook_router, prefix="/webhook", tags=["webhooks"])
app.include_router(data_router, prefix="/api", tags=["data"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    create_tables()
    print("🚀 Distill Webhook Visualizer started successfully!")
    print("📡 Webhook endpoint: http://localhost:8000/webhook/distill")
    print("🌐 Dashboard: http://localhost:8000/dashboard")
    print("📚 API Docs: http://localhost:8000/docs")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Home page with overview."""
    return {"message": "Distill Webhook Visualizer is running!", "docs": "/docs"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "distill-webhook-visualizer"}


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