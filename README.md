# Distill Webhook Visualizer

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

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/giraphant/distill-webhook-visualizer.git
cd distill-webhook-visualizer

# Start with Docker
docker build -t distill-visualizer .
docker run -p 8000:8000 distill-visualizer
```

### Option 2: Local Development

```bash
git clone https://github.com/giraphant/distill-webhook-visualizer.git
cd distill-webhook-visualizer

# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

### Distill Setup

1. **Configure Webhook URL**: Set your Distill webhook to:
   ```
   http://your-server:8000/webhook/distill
   ```

2. **Expected Payload Format**:
   ```json
   {
     "monitor_id": "unique_monitor_id",
     "monitor_name": "My Website Monitor",
     "url": "https://example.com",
     "value": 123.45,
     "status": "changed",
     "timestamp": "2023-01-01T12:00:00Z",
     "is_change": true
   }
   ```

## 🔌 API Endpoints

### Webhook Endpoints
- `POST /webhook/distill` - Receive Distill webhook data
- `POST /webhook/test` - Test webhook functionality
- `GET /webhook/status` - Get webhook service status

### Data API
- `GET /api/data` - Retrieve monitoring data with filtering
- `GET /api/monitors` - Get monitor summaries and statistics
- `GET /api/chart-data/{monitor_id}` - Get chart-ready data

### Management
- `GET /health` - Application health check
- `DELETE /api/data/{record_id}` - Delete specific record
- `DELETE /api/monitors/{monitor_id}` - Delete all monitor data

Full API documentation available at: `http://localhost:8000/docs`

## 🧪 Testing

Send test data to verify setup:

```bash
curl -X POST "http://localhost:8000/webhook/distill" \
  -H "Content-Type: application/json" \
  -d '{
    "monitor_id": "test_monitor",
    "url": "https://example.com",
    "value": 42.5,
    "status": "ok",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

## 📁 Project Structure

```
distill-webhook-visualizer/
├── app/
│   ├── api/              # API route handlers
│   ├── models/           # Database models
│   └── visualization/    # Chart generation
├── templates/            # HTML templates
├── scripts/             # Deployment scripts
├── main.py              # Application entry point
├── requirements.txt     # Python dependencies
├── Dockerfile           # Docker configuration
└── README.md           # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/) and [Plotly](https://plotly.com/)
- Designed for [Distill Web Monitor](https://distill.io/)