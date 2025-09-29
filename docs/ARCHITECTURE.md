# 前后端分离架构设计

## 项目结构

```
distill-webhook-visualiser/
├── backend/                 # FastAPI 后端服务
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── models/         # 数据模型
│   │   ├── core/           # 核心配置
│   │   └── services/       # 业务逻辑
│   ├── requirements.txt
│   └── main.py
├── frontend/               # React 前端应用
│   ├── src/
│   │   ├── components/     # shadCN UI 组件
│   │   ├── pages/          # 页面组件
│   │   ├── lib/            # 工具库
│   │   ├── hooks/          # React Hooks
│   │   └── types/          # TypeScript 类型
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yml      # 容器化部署
└── README.md
```

## 技术栈

### 后端 (FastAPI)
- **框架**: FastAPI + Uvicorn
- **数据库**: SQLAlchemy + SQLite/PostgreSQL
- **API文档**: OpenAPI (Swagger)
- **CORS**: 支持跨域访问

### 前端 (React)
- **框架**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **组件库**: shadCN UI
- **路由**: React Router
- **状态管理**: React Query + Zustand
- **图表**: Recharts
- **构建**: Vite

## API 端点设计

### 核心 API
- `GET /api/health` - 健康检查
- `POST /webhook/distill` - 接收 Distill 数据
- `GET /api/data` - 查询监控数据
- `GET /api/monitors` - 获取监控器列表
- `GET /api/chart-data/{monitor_id}` - 图表数据

### 管理 API
- `POST /api/generate-sample` - 生成示例数据
- `DELETE /api/clear-all` - 清空所有数据
- `GET /api/stats` - 统计信息

## 部署方案

### 开发环境
- 后端: `uvicorn main:app --reload --port 8000`
- 前端: `npm run dev --port 3000`

### 生产环境
- Docker Compose 一键部署
- Nginx 反向代理
- 前端打包为静态文件

## 优势

1. **技术现代化**: React + TypeScript + Tailwind
2. **开发体验**: 热重载、类型安全、组件化
3. **可维护性**: 前后端独立开发和部署
4. **性能优化**: 前端可做 CDN 缓存
5. **扩展性**: 可独立扩展前端或后端