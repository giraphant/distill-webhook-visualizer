# Distill Webhook Visualiser

A powerful, production-ready web application for receiving, storing, and visualizing data from Distill Web Monitor webhooks in real-time.

## ✨ Features

- 📡 **Real-time Webhook Processing**: Accept and process Distill monitoring data instantly
- 💾 **Persistent Data Storage**: SQLite database with comprehensive data models
- 📊 **Interactive Visualizations**: Time-series charts and data analysis
- 🌐 **Modern Web Interface**: Responsive design with real-time updates
- 🔍 **Advanced Data Management**: Flexible filtering, search, and export
- 🚀 **Production Ready**: Docker support with health checks
- 📚 **Developer Friendly**: Auto-generated API documentation

## 🚀 Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/giraphant/distill-webhook-visualiser.git
cd distill-webhook-visualiser

# Start with Docker Compose
docker-compose up --build -d
```

### Local Development

```bash
cd backend
pip install -r requirements.txt
python main.py
```

## 🔧 Configuration

Create a `.env` file:

```bash
# Application Settings
HOST=0.0.0.0
PORT=8000
DATABASE_URL=sqlite:///./data/monitoring.db
LOG_LEVEL=info

# Security (change in production)
SECRET_KEY=your-secure-secret-key-here

# Domain (for CORS)
DOMAIN=your-domain.com
CORS_ORIGINS=https://your-domain.com
```

## 🔌 API Endpoints

### Webhook Endpoints
- `POST /webhook/distill` - Receive Distill webhook data
- `GET /health` - Application health check

### Data API
- `GET /api/data` - Retrieve monitoring data with filtering
- `GET /api/monitors` - Get monitor summaries and statistics
- `GET /api/chart-data/{monitor_id}` - Get chart-ready data

Full API documentation available at: `http://localhost:8000/docs`

## 🧪 Testing the Webhook

```bash
curl -X POST "http://localhost:8000/webhook/distill" \
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

## 📁 Project Structure

```
distill-webhook-visualiser/
├── backend/              # FastAPI backend application
│   ├── app/
│   │   ├── api/         # API route handlers
│   │   ├── models/      # Database models
│   │   ├── services/    # External services (Pushover, etc.)
│   │   └── visualization/  # Chart generation
│   ├── main.py          # Application entry point
│   ├── requirements.txt # Python dependencies
│   └── alert_daemon.py  # Background alert daemon
├── frontend/            # React frontend application
├── scripts/             # Utility scripts and deployment tools
├── static/              # Static assets (sounds, images)
├── docs/                # Documentation
├── Dockerfile           # Docker configuration
└── docker-compose.yml   # Docker Compose setup
```

## 🌐 Production Deployment

For production deployment with custom domains and SSL certificates, configure your reverse proxy (nginx/Traefik) to point to the application container.

The application is designed to work seamlessly with container orchestration platforms like Coolify, Docker Swarm, or Kubernetes.

## 📄 License

This project is licensed under the MIT License.