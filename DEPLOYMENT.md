# Deployment Guide

This guide will help you deploy the Distill Webhook Visualizer to your own domain.

## Prerequisites

- Docker and Docker Compose installed
- A domain name (e.g., your-domain.com)
- SSL certificates for your domain
- Reverse proxy (nginx recommended)

## Quick Setup

### 1. Environment Configuration

Copy the example environment file and configure it for your domain:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` and change:
- `DOMAIN=your-domain.com` (replace with your actual domain)
- `SECRET_KEY=your-secret-key-here` (generate a secure random key)

### 2. Docker Configuration

Copy the example Docker Compose file:

```bash
cp docker-compose.production.example.yml docker-compose.production.yml
```

### 3. Nginx Configuration

Copy the example nginx configuration:

```bash
cp nginx.example.conf nginx.conf
```

Edit `nginx.conf` and replace:
- `YOUR_DOMAIN_HERE` with your actual domain
- SSL certificate paths with your actual certificate locations

### 4. Deployment Script

Copy the example deployment script:

```bash
cp deploy.example.sh deploy.sh
chmod +x deploy.sh
```

Edit `deploy.sh` and change:
- `DOMAIN="your-domain.com"` to your actual domain

### 5. Deploy

Run the deployment script:

```bash
./deploy.sh
```

## Manual Steps

If you prefer manual deployment:

1. **Create required directories:**
   ```bash
   mkdir -p data logs
   chmod 755 data logs
   ```

2. **Start the application:**
   ```bash
   docker-compose -f docker-compose.production.yml up --build -d
   ```

3. **Configure nginx and SSL certificates**

4. **Test the deployment:**
   ```bash
   curl -f http://localhost:8080/health
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOMAIN` | Your domain name | `localhost` |
| `SECRET_KEY` | Secret key for security | Required |
| `DATABASE_URL` | Database connection string | `sqlite:///./data/monitoring.db` |
| `LOG_LEVEL` | Logging level | `info` |

## Security Notes

- Never commit `.env.production`, `nginx.conf`, or `deploy.sh` to version control
- Use a strong, unique `SECRET_KEY`
- Ensure SSL certificates are properly configured
- Regularly update Docker images for security patches

## Troubleshooting

### Application won't start
- Check Docker logs: `docker-compose -f docker-compose.production.yml logs`
- Verify `.env.production` configuration
- Ensure ports are not in use

### Domain not accessible
- Verify nginx configuration
- Check SSL certificate validity
- Ensure DNS records point to your server
- Verify firewall rules allow traffic on ports 80 and 443

### Webhook not receiving data
- Test webhook endpoint: `curl -X POST https://your-domain.com/webhook/distill`
- Check application logs for errors
- Verify Distill Web Monitor configuration