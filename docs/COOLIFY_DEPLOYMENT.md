# Coolify 部署指南

## 准备工作

这个项目已经完全Docker化，可以直接在Coolify部署。

## 在 Coolify 部署步骤

### 1. 创建新应用

1. 登录你的 Coolify 控制台
2. 点击 **+ New Resource** → **Application**
3. 选择 **Docker Compose** 类型
4. 填写基本信息：
   - **Name**: `distill-webhook-visualizer`
   - **Git Repository**: `https://github.com/giraphant/distill-webhook-visualiser.git`
   - **Branch**: `main`

### 2. 配置环境变量

在 Coolify 的环境变量设置中添加以下变量：

```bash
# 基本配置
DOMAIN=your-domain.com              # 你的域名，例如: distill.example.com
PORT=9988                           # 内部端口，保持默认即可
HOST=0.0.0.0

# 用户认证密码（重要！请修改为强密码）
RAMU_PASSWORD=your_strong_password_1
LIGIGY_PASSWORD=your_strong_password_2
QUASI_PASSWORD=your_strong_password_3

# CORS配置（根据你的域名修改）
CORS_ORIGINS=https://your-domain.com,http://localhost:3000
```

### 3. 配置域名和端口

1. **在 Coolify 中配置域名**：
   - 在应用设置的 **Domains** 部分
   - 添加你的域名，例如：`distill.example.com`
   - Coolify 会自动配置 HTTPS (Let's Encrypt)

2. **端口映射**（Coolify 通常会自动处理，但如果需要手动配置）：
   - Container Port: `9988`
   - Public Port: `443` (HTTPS) / `80` (HTTP)

### 4. 部署配置

Coolify 会自动使用项目根目录的 `docker-compose.yml` 文件。

**重要**：确保在 Coolify 的构建设置中：
- Build Method: **Docker Compose**
- Docker Compose File: `docker-compose.yml`（默认）

### 5. 持久化数据

Coolify 会自动处理 volumes，但确保以下目录被持久化：
- `./data` - SQLite 数据库
- `./logs` - 应用日志

这些在 `docker-compose.yml` 中已经配置好了。

### 6. 部署

1. 检查所有配置是否正确
2. 点击 **Deploy** 按钮
3. 观察构建日志，确保没有错误
4. 等待应用启动（健康检查通过）

### 7. 验证部署

部署成功后，访问你配置的域名：

```bash
# 健康检查
curl https://your-domain.com/health

# API文档
https://your-domain.com/docs

# 主页
https://your-domain.com/
```

## 重要端点

- **主页**: `https://your-domain.com/`
- **Webhook**: `https://your-domain.com/webhook/distill`
- **API文档**: `https://your-domain.com/docs`
- **健康检查**: `https://your-domain.com/health`

## Distill Web Monitor 配置

在 Distill 中配置 Webhook：

1. URL: `https://your-domain.com/webhook/distill`
2. Method: POST
3. 确保发送 JSON 格式的数据

## 故障排查

### 1. 应用无法启动
- 检查 Coolify 日志：`docker logs <container_name>`
- 确认环境变量是否正确设置
- 确认端口没有冲突

### 2. 无法访问应用
- 检查域名 DNS 是否正确指向服务器
- 确认 Coolify 的反向代理配置正确
- 检查防火墙规则

### 3. Webhook 不工作
- 检查 Distill 发送的数据格式
- 查看应用日志：`docker logs <container_name> | grep webhook`
- 确认 CORS 配置包含了正确的域名

### 4. 告警不发送
- 检查 Pushover 配置是否正确（在应用设置页面）
- 查看 alert daemon 日志：`docker logs <container_name> | grep alert`

## 数据备份

重要：定期备份 `./data/monitoring.db` 文件

```bash
# 在 Coolify 服务器上
docker exec <container_name> sqlite3 /app/data/monitoring.db ".backup '/app/data/backup.db'"
```

## 更新应用

Coolify 支持自动部署，你也可以手动触发：

1. 推送代码到 GitHub
2. 在 Coolify 点击 **Redeploy**
3. Coolify 会自动拉取最新代码并重新构建

## 环境变量详解

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `DOMAIN` | 否 | `localhost` | 应用域名 |
| `PORT` | 否 | `9988` | 应用端口 |
| `HOST` | 否 | `0.0.0.0` | 监听地址 |
| `RAMU_PASSWORD` | 否 | `changeme` | 用户ramu的密码 |
| `LIGIGY_PASSWORD` | 否 | `changeme` | 用户ligigy的密码 |
| `QUASI_PASSWORD` | 否 | `changeme` | 用户quasi的密码 |
| `CORS_ORIGINS` | 否 | 自动生成 | 允许的CORS来源 |

## 安全建议

1. **修改默认密码**：务必在环境变量中设置强密码
2. **HTTPS**：Coolify 自动配置 Let's Encrypt，确保使用 HTTPS
3. **防火墙**：只开放必要的端口（443, 80）
4. **定期备份**：设置自动备份任务
5. **日志监控**：定期检查应用日志

## 性能优化

- 应用使用 SQLite，适合中小规模使用
- 如果数据量大，考虑迁移到 PostgreSQL
- 调整 Docker 资源限制（CPU、内存）根据实际负载

## 支持

- GitHub Issues: https://github.com/giraphant/distill-webhook-visualiser/issues
- API 文档: https://your-domain.com/docs
