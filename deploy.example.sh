#!/bin/bash

# Distill Webhook Visualizer Deployment Script Template
# Copy this to deploy.sh and modify for your domain

set -e

# Configuration - CHANGE THESE VALUES
DOMAIN="your-domain.com"
APP_PORT="8080"

echo "🚀 Starting deployment of Distill Webhook Visualizer for $DOMAIN..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p data logs

# Set proper permissions
chmod 755 data logs

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found. Please copy from .env.production.example and configure."
    exit 1
fi

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Build and start the application
echo "🔨 Building and starting the application..."
docker-compose -f docker-compose.production.yml up --build -d

# Wait for the application to start
echo "⏳ Waiting for application to start..."
sleep 10

# Check if the application is healthy
echo "🔍 Checking application health..."
if curl -f http://localhost:$APP_PORT/health &>/dev/null; then
    echo "✅ Application is running and healthy!"
    echo "🌐 Local access: http://localhost:$APP_PORT"
    echo "🔗 Production URL: https://$DOMAIN"
    echo "📚 API Documentation: https://$DOMAIN/docs"
    echo "🎯 Webhook endpoint: https://$DOMAIN/webhook/distill"
else
    echo "❌ Application health check failed!"
    echo "📋 Container logs:"
    docker-compose -f docker-compose.production.yml logs
    exit 1
fi

echo ""
echo "📋 Next steps:"
echo "1. Configure your reverse proxy (nginx) to point $DOMAIN to localhost:$APP_PORT"
echo "2. Set up SSL certificates for $DOMAIN"
echo "3. Test webhook endpoint with: curl -X POST https://$DOMAIN/webhook/distill"
echo ""
echo "✨ Deployment completed successfully!"