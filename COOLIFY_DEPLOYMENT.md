# Coolify Deployment Guide

## Quick Deployment in Coolify

### 1. Create New Application
1. Login to your Coolify dashboard
2. Create a new application
3. Choose "Git Repository" as source
4. Connect to your Git repository containing this code

### 2. Dockerfile Configuration
- **Dockerfile**: Use `Dockerfile.production` (or rename it to `Dockerfile`)
- **Port**: `8000`
- **Health Check Path**: `/health`

### 3. Environment Variables
Set these in Coolify's Environment Variables section:

```bash
# Required
SECRET_KEY=your-super-secret-key-here-change-this
DATABASE_URL=sqlite:///./data/monitoring.db
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info

# Optional (Coolify will auto-configure based on domain)
# DOMAIN=distill.quasifi.sh
# CORS_ORIGINS=https://distill.quasifi.sh
```

### 4. Domain Configuration
- **Domain**: `distill.quasifi.sh`
- **SSL**: Let Coolify auto-generate SSL certificate
- **Force HTTPS**: Enable

### 5. Storage (Optional but Recommended)
Mount persistent volume for data:
- **Host Path**: `/app/data`
- **Container Path**: `/app/data`

### 6. Deploy
Click "Deploy" and Coolify will:
- ✅ Build the Docker image
- ✅ Deploy the container
- ✅ Configure reverse proxy
- ✅ Generate SSL certificates
- ✅ Set up health checks

## Post-Deployment

### Webhook Endpoint
Your webhook will be available at:
```
https://distill.quasifi.sh/webhook/distill
```

### API Documentation
Available at:
```
https://distill.quasifi.sh/docs
```

### Health Check
```
https://distill.quasifi.sh/health
```

## Testing the Webhook

Send a test webhook:
```bash
curl -X POST "https://distill.quasifi.sh/webhook/distill" \
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

## Troubleshooting

### Common Issues
1. **App won't start**: Check environment variables, especially `SECRET_KEY`
2. **Database errors**: Ensure persistent volume is mounted to `/app/data`
3. **CORS errors**: Verify domain configuration matches your actual domain

### Logs
Check logs in Coolify dashboard under your application's "Logs" section.

### Health Check
If health check fails, verify the app is responding on `/health` endpoint.