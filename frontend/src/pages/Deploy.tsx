import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Server, Database, Play, Square, RefreshCw } from 'lucide-react';

const Deploy: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Deploy & Manage</h1>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
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
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="font-medium">Service: Healthy</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Application is running normally
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
              <Button variant="outline" className="w-full">
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
              <Button variant="outline" className="w-full">
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
              <Button variant="outline" className="w-full">
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
            <Button className="w-full" variant="default">
              <Play className="h-4 w-4 mr-2" />
              Start Service
            </Button>
            <Button className="w-full" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart Service
            </Button>
            <Button className="w-full" variant="destructive">
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
            <Button className="w-full" variant="outline">
              View Logs
            </Button>
            <Button className="w-full" variant="outline">
              Update Application
            </Button>
            <Button className="w-full" variant="outline">
              Backup Database
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Deploy;