#!/usr/bin/env python3
"""
Distill Webhook Visualizer - Backend API Server
Pure FastAPI API service for webhook data processing and visualization.
"""

import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.webhook import router as webhook_router
from app.api.data import router as data_router
from app.models.database import create_tables


# Initialize FastAPI app
app = FastAPI(
    title="Distill Webhook Visualizer API",
    description="Backend API for Distill Web Monitor data processing and visualization",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(webhook_router, prefix="/webhook", tags=["webhooks"])
app.include_router(data_router, prefix="/api", tags=["data"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    create_tables()
    print("🚀 Distill Webhook Visualizer API started successfully!")
    print("📡 Webhook endpoint: http://localhost:8000/webhook/distill")
    print("🔌 API Base URL: http://localhost:8000/api")
    print("📚 API Docs: http://localhost:8000/docs")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "distill-webhook-visualizer-api",
        "version": "2.0.0"
    }


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "message": "Distill Webhook Visualizer API",
        "version": "2.0.0",
        "docs": "/docs",
        "webhook_endpoint": "/webhook/distill",
        "frontend_url": "http://localhost:3000"
    }


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