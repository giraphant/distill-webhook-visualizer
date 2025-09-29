# Development Guide

This guide covers development setup, architecture details, and contribution guidelines for the Distill Webhook Visualiser.

## 🏗️ Architecture Overview

### Frontend Architecture (React + TypeScript)
```
frontend/src/
├── components/
│   ├── ui/                 # shadCN UI components
│   ├── charts/             # Chart components (Recharts)
│   └── layout/             # Layout components
├── pages/                  # Route components
├── hooks/                  # Custom React hooks
├── services/               # API service layer
├── lib/                    # Utility functions
└── types/                  # TypeScript type definitions
```

### Backend Architecture (FastAPI)
```
backend/
├── app/
│   ├── api/               # API route handlers
│   ├── models/            # Database models & Pydantic schemas
│   ├── core/              # Configuration and utilities
│   └── services/          # Business logic
├── main.py               # Application entry point
└── data/                 # SQLite database storage
```

## 🛠️ Development Setup

### Prerequisites
- **Node.js** 18+ (for frontend)
- **Python** 3.9+ (for backend)
- **Docker** (optional, for containerized development)
- **Git** (for version control)

### 1. Clone and Setup
```bash
git clone https://github.com/giraphant/distill-webhook-visualiser.git
cd distill-webhook-visualiser
```

### 2. Backend Development Setup
```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Run development server
python main.py
```

Backend will be available at: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

### 3. Frontend Development Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm start
```

Frontend will be available at: `http://localhost:3000`

## 🔧 Development Workflow

### Code Style and Formatting

#### Frontend (TypeScript/React)
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

#### Backend (Python)
```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

### Testing

#### Frontend Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

#### Backend Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_webhook.py
```

### Database Management

#### Development Database
- **Type**: SQLite (default)
- **Location**: `backend/data/monitoring.db`
- **Migrations**: Auto-created on startup

#### Reset Database
```bash
cd backend
rm -f data/monitoring.db
python main.py  # Will recreate database
```

## 🐳 Docker Development

### Full Stack Development
```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up backend
docker-compose up frontend

# Rebuild after changes
docker-compose up --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Development with Hot Reload
```bash
# Backend with volume mount for hot reload
docker-compose -f docker-compose.dev.yml up backend

# Frontend with volume mount
docker-compose -f docker-compose.dev.yml up frontend
```

## 📝 Adding New Features

### Adding a New API Endpoint

1. **Create the endpoint** in `backend/app/api/`:
```python
# backend/app/api/new_feature.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/new-endpoint")
async def new_endpoint():
    return {"message": "Hello from new endpoint"}
```

2. **Register the router** in `backend/main.py`:
```python
from app.api.new_feature import router as new_feature_router

app.include_router(new_feature_router, prefix="/api", tags=["new-feature"])
```

3. **Add frontend integration** in `frontend/src/services/api.ts`:
```typescript
export const apiService = {
  // ... existing methods

  async getNewFeature(): Promise<any> {
    const response = await api.get('/api/new-endpoint');
    return response.data;
  },
};
```

### Adding a New React Component

1. **Create the component** in `frontend/src/components/`:
```typescript
// frontend/src/components/NewComponent.tsx
import React from 'react';

interface NewComponentProps {
  title: string;
}

const NewComponent: React.FC<NewComponentProps> = ({ title }) => {
  return <div>{title}</div>;
};

export default NewComponent;
```

2. **Add to a page** in `frontend/src/pages/`:
```typescript
import NewComponent from '@/components/NewComponent';

// Use in JSX
<NewComponent title="Hello World" />
```

## 🔍 Debugging

### Backend Debugging
```bash
# Enable debug logging
export LOG_LEVEL=debug
python main.py

# Use Python debugger
import pdb; pdb.set_trace()
```

### Frontend Debugging
```bash
# Enable React dev tools
# Install React Developer Tools browser extension

# Console debugging
console.log('Debug info:', data);

# VS Code debugging with breakpoints
# Configure launch.json for React debugging
```

### Docker Debugging
```bash
# Execute into running container
docker-compose exec backend bash
docker-compose exec frontend sh

# View container logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Inspect container
docker inspect distill-backend
```

## 🚀 Deployment

### Development Deployment
```bash
# Quick local deployment
docker-compose up -d

# Check health
curl http://localhost:8000/health
curl http://localhost:3000
```

### Production Deployment
```bash
# Build production images
docker-compose build

# Deploy with production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Set production environment
cp .env.production .env
```

## 📚 Useful Commands

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "Add new feature"

# Push branch
git push origin feature/new-feature
```

### Docker Commands
```bash
# View running containers
docker-compose ps

# Stop all services
docker-compose down

# Remove volumes (reset data)
docker-compose down -v

# Pull latest images
docker-compose pull
```

### Package Management
```bash
# Frontend - Add new dependency
npm install package-name
npm install --save-dev package-name

# Backend - Add new dependency
pip install package-name
pip freeze > requirements.txt
```

## 🐛 Common Issues

### Frontend Issues
1. **Module resolution errors**: Check `tsconfig.json` paths and restart dev server
2. **CORS errors**: Verify backend CORS configuration
3. **Build failures**: Clear `node_modules` and reinstall

### Backend Issues
1. **Import errors**: Check `PYTHONPATH` and virtual environment
2. **Database locked**: Ensure no other process is using SQLite
3. **Port conflicts**: Change `PORT` environment variable

### Docker Issues
1. **Build cache**: Use `docker-compose build --no-cache`
2. **Volume permissions**: Check file ownership in containers
3. **Network connectivity**: Verify service names in docker-compose.yml

## 🤝 Contributing Guidelines

1. **Fork** the repository
2. **Create** a feature branch from `main`
3. **Make** your changes with proper tests
4. **Follow** code style guidelines
5. **Write** clear commit messages
6. **Submit** a Pull Request with description
7. **Respond** to review feedback

### Pull Request Template
```markdown
## Changes
- [ ] Feature/Bug description
- [ ] Tests added/updated
- [ ] Documentation updated

## Testing
- [ ] Frontend tests pass
- [ ] Backend tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Breaking changes documented
```

This development guide should help you get started with contributing to the Distill Webhook Visualiser project!