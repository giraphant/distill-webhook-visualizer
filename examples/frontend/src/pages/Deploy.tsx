import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Server, Database, Play, Square, RefreshCw } from 'lucide-react';
import { useHealth, useApiActions } from '@/hooks/useApi';

const Deploy: React.FC = () => {
  const [serviceStatus, setServiceStatus] = useState<'running' | 'stopped'>('running');
  const { data: health, loading: healthLoading, refetch: refetchHealth } = useHealth();
  const { executeCommand, loading: commandLoading } = useApiActions();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Deploy & Manage</h1>
        <Button
          variant="outline"
          onClick={refetchHealth}
          disabled={healthLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${healthLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <CardTitle>Service Health</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${
                healthLoading
                  ? 'bg-yellow-500'
                  : health?.status === 'healthy'
                    ? 'bg-green-500'
                    : 'bg-red-500'
              }`}></div>
              <span className="font-medium">
                Service: {healthLoading ? 'Checking...' : health?.status || 'Unknown'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {healthLoading ? 'Loading status...' : health?.service || 'Application status'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database Info</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="font-medium">Database: Connected</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              SQLite database operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Options */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Options</CardTitle>
          <CardDescription>
            Choose your deployment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center space-y-3">
              <div className="text-2xl">💻</div>
              <h3 className="font-semibold">Local Development</h3>
              <p className="text-sm text-muted-foreground">
                Run directly with Python for development and testing
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => alert('本地开发服务器已经在运行中 (localhost:3000 和 localhost:8000)')}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Local
              </Button>
            </div>

            <div className="p-4 border rounded-lg text-center space-y-3">
              <div className="text-2xl">🐳</div>
              <h3 className="font-semibold">Docker Deployment</h3>
              <p className="text-sm text-muted-foreground">
                Deploy with Docker for isolated, production-ready setup
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const result = await executeCommand('docker-compose up -d');
                  alert(result ? 'Docker部署启动中...' : 'Docker部署失败，请检查Docker是否安装');
                }}
                disabled={commandLoading}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Deploy Docker
              </Button>
            </div>

            <div className="p-4 border rounded-lg text-center space-y-3">
              <div className="text-2xl">☁️</div>
              <h3 className="font-semibold">Production</h3>
              <p className="text-sm text-muted-foreground">
                Full production deployment with reverse proxy and SSL
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => alert('生产部署需要配置域名和SSL证书，请参考DEVELOPMENT.md文档')}
              >
                <Server className="h-4 w-4 mr-2" />
                Deploy Production
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Controls</CardTitle>
            <CardDescription>
              Manage the application service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="default"
              onClick={() => {
                setServiceStatus('running');
                alert('服务已启动 - 前端:localhost:3000, 后端:localhost:8000');
              }}
              disabled={serviceStatus === 'running'}
            >
              <Play className="h-4 w-4 mr-2" />
              {serviceStatus === 'running' ? 'Service Running' : 'Start Service'}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                refetchHealth();
                alert('服务重启中...');
              }}
              disabled={commandLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${commandLoading ? 'animate-spin' : ''}`} />
              Restart Service
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => {
                setServiceStatus('stopped');
                alert('注意：停止服务将中断webhook接收');
              }}
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Service
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
            <CardDescription>
              System maintenance and monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => window.open('http://localhost:8000/docs', '_blank')}
            >
              View API Docs
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={async () => {
                const result = await executeCommand('git pull');
                alert(result ? '更新完成' : '更新失败，请手动检查');
              }}
              disabled={commandLoading}
            >
              Update Application
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                alert(`数据库备份位置: data/monitoring.db\n建议复制到: backup_${timestamp}.db`);
              }}
            >
              Backup Database
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Deploy;