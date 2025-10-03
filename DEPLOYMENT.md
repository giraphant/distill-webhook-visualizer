# 自动化部署指南

## 快速部署

本项目提供了自动化部署脚本，可以一键完成前端构建、提交和推送到GitHub。

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
5. 🔄 Coolify通过GitHub webhook自动部署

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
│  GitHub Webhook │  ← GitHub通知Coolify
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Coolify 自动部署│  ← 自动拉取并部署
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  部署完成 ✅     │
└─────────────────┘
```

## Coolify自动部署

Coolify会监听GitHub仓库的push事件，当代码推送到GitHub后会自动触发部署。

### 确认Webhook配置

在Coolify应用设置中确认：
- ✅ 启用了"Auto Deploy"选项
- ✅ GitHub webhook已配置

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

### 4. Coolify自动部署

推送到GitHub后，Coolify会自动检测到更改并开始部署。

或者在Coolify UI中手动点击 **Redeploy** 按钮。

## 故障排查

### 部署失败

如果部署失败，检查：

1. **GitHub连接**: 确保代码成功推送到GitHub
2. **Coolify Webhook**: 在Coolify中确认webhook是否触发
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

✅ 部署脚本不包含敏感信息，安全提交到版本控制。
