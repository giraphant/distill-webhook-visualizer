# 自动化部署指南

## 快速部署

本项目提供了自动化部署脚本，可以一键完成前端构建、提交和Coolify部署。

### 使用方法

直接运行部署脚本：

```bash
./deploy.sh
```

脚本会自动完成：
1. 📦 构建React前端
2. 📋 复制构建文件到static目录
3. 📝 Git提交更改
4. ⬆️ 推送到GitHub
5. 🔄 触发Coolify部署

### 部署流程说明

```
┌─────────────────┐
│  修改前端代码    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  npm run build  │  ← 构建React应用
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  复制到static/  │  ← FastAPI提供静态文件
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  git commit     │  ← 提交到版本控制
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  git push       │  ← 推送到GitHub
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Coolify API    │  ← 触发重新部署
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  部署完成 ✅     │
└─────────────────┘
```

## Coolify API配置

脚本使用Coolify API进行部署，默认配置：

- **API端点**: `http://localhost:8000`
- **应用UUID**: `y0cgo840wccc44sccw4wkoks`

### 环境变量覆盖

可以通过环境变量自定义配置：

```bash
# 自定义Coolify URL
COOLIFY_URL=https://coolify.example.com ./deploy.sh

# 自定义应用UUID
APPLICATION_UUID=your-app-uuid ./deploy.sh
```

## 手动部署

如果需要手动部署，可以分步执行：

### 1. 构建前端

```bash
cd frontend
npm run build
```

### 2. 复制静态文件

```bash
cp -r frontend/build/* static/
```

### 3. 提交和推送

```bash
git add -A
git commit -m "Update frontend"
git push
```

### 4. 在Coolify中重新部署

在Coolify UI中点击 **Redeploy** 按钮，或使用API：

```bash
curl -X POST "http://localhost:8000/api/v1/deploy?uuid=y0cgo840wccc44sccw4wkoks&force=false" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Accept: application/json"
```

## 故障排查

### 部署失败

如果部署失败，检查：

1. **网络连接**: 确保能访问Coolify API
2. **API Token**: 确认token有效且有权限
3. **Git状态**: 确保没有未提交的冲突

### 查看部署日志

```bash
# 在Coolify UI中查看实时日志
# 或使用Docker命令
docker logs -f app-y0cgo840wccc44sccw4wkoks-XXXXXXXXX
```

## 最佳实践

1. **测试后部署**: 在本地测试前端改动后再部署
2. **有意义的提交**: 虽然脚本会自动生成提交信息，但重要更新最好手动提交
3. **监控部署**: 部署后检查Coolify日志确认成功

## 安全提示

⚠️ **重要**: `deploy.sh` 包含API token，已被 `.gitignore` 排除。不要将其提交到版本控制！
