# Coolify Stack部署指南

## 🚀 三种部署方式

### 方式1：Docker Compose Stack (推荐)

1. **登录Coolify控制台**
2. **创建新的Stack**
3. **复制 `coolify-stack.yml` 内容到Stack配置**
4. **设置环境变量**：
   ```
   DOMAIN=distill.quasifi.sh
   SECRET_KEY=your-super-secure-secret-key-here
   ```
5. **点击部署**

### 方式2：Git Repository部署

1. **创建新Application**
2. **选择Git Repository**
3. **Repository**: `https://github.com/giraphant/distill-webhook-visualizer`
4. **Docker Compose文件**: `docker-compose.coolify.yml`
5. **环境变量**：使用 `.env` 文件中的配置

### 方式3：Docker Image部署

1. **创建新Application**
2. **选择Docker Image**
3. **使用预构建镜像**: `distill-webhook-visualizer:latest`
4. **端口**: `8000`
5. **环境变量**：手动设置所需变量

## 🔧 必需的环境变量

```bash
# 域名配置
DOMAIN=distill.quasifi.sh

# 安全密钥 (必须修改!)
SECRET_KEY=your-super-secure-random-key-here

# 应用配置
HOST=0.0.0.0
PORT=8000
DATABASE_URL=sqlite:///./data/monitoring.db
LOG_LEVEL=info

# CORS配置
CORS_ORIGINS=https://distill.quasifi.sh
```

## 📦 持久化存储

确保配置以下卷挂载：
- **数据库**: `/app/data` → 持久化SQLite数据库
- **日志**: `/app/logs` → 应用日志文件

## 🌐 部署后访问

- **主页**: `https://distill.quasifi.sh`
- **API文档**: `https://distill.quasifi.sh/docs`
- **健康检查**: `https://distill.quasifi.sh/health`
- **Webhook端点**: `https://distill.quasifi.sh/webhook/distill`

## 🧪 测试Webhook

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

## ⚠️ 重要提醒

1. **一定要修改 `SECRET_KEY`** - 使用随机生成的安全密钥
2. **配置持久化存储** - 避免数据丢失
3. **SSL自动配置** - Coolify会自动处理Let's Encrypt证书