# Examples

This directory contains example implementations and reference architectures.

## Contents

### Frontend Separation Example
- **Location**: `examples/frontend/`
- **Description**: React + TypeScript frontend implementation
- **Tech Stack**: React 18, Tailwind CSS, shadCN UI
- **Purpose**: Reference for frontend-only deployment

### Backend Separation Example
- **Location**: `examples/backend/`
- **Description**: FastAPI backend-only implementation
- **Tech Stack**: FastAPI, SQLAlchemy, SQLite
- **Purpose**: Reference for API-only deployment

## Usage

These examples demonstrate how to split the monolithic application into separate frontend and backend services if needed for your deployment architecture.

### When to Use Examples

1. **Microservices Architecture**: Split into separate containers
2. **CDN Deployment**: Frontend as static files
3. **API Gateway**: Backend as standalone API service
4. **Development Workflow**: Separate team responsibilities

### Main Application

The main application in the root directory provides a complete monolithic solution that's easier to deploy and manage for most use cases.