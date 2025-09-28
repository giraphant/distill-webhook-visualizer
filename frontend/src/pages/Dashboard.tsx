import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Database, Activity, Clock, RefreshCw } from 'lucide-react';
import { useWebhookStatus, useMonitorSummaries, useChartData, useApiActions } from '@/hooks/useApi';
import LineChart from '@/components/charts/LineChart';
import StatsChart from '@/components/charts/StatsChart';

const Dashboard: React.FC = () => {
  const [selectedMonitor, setSelectedMonitor] = useState<string | null>(null);

  const { data: webhookStatus, loading: statusLoading, refetch: refetchStatus } = useWebhookStatus();
  const { data: monitors, loading: monitorsLoading, refetch: refetchMonitors } = useMonitorSummaries();
  const { data: chartData, loading: chartLoading } = useChartData(selectedMonitor);
  const { generateSampleData, loading: actionLoading } = useApiActions();

  const handleRefresh = () => {
    refetchStatus();
    refetchMonitors();
  };

  const handleGenerateSample = async () => {
    await generateSampleData();
    refetchStatus();
    refetchMonitors();
  };

  const formatLastUpdate = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const totalChanges = monitors?.reduce((acc, monitor) => acc + monitor.change_count, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateSample}
            disabled={actionLoading}
          >
            <Database className="h-4 w-4 mr-2" />
            Generate Sample Data
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={statusLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusLoading ? '--' : webhookStatus?.statistics.total_records.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {statusLoading ? 'Loading...' : 'Total webhook records received'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Monitors</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitorsLoading ? '--' : monitors?.length || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {monitorsLoading ? 'Loading...' : 'Unique monitors configured'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Changes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitorsLoading ? '--' : totalChanges.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {monitorsLoading ? 'Loading...' : 'Changes detected across monitors'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusLoading ? '--' : formatLastUpdate(webhookStatus?.statistics.latest_record || null)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statusLoading ? 'Loading...' : 'Most recent data received'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Monitor Data Visualization</CardTitle>
              <CardDescription>
                {selectedMonitor ? `Time-series data for ${chartData?.monitor_name || selectedMonitor}` : 'Select a monitor to view its data'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : chartData && chartData.data.length > 0 ? (
                <LineChart
                  data={chartData.data}
                  title={chartData.monitor_name}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {selectedMonitor ? 'No data available for this monitor' : 'Select a monitor to view its chart'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitor List</CardTitle>
              <CardDescription>
                Select a monitor to view its data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monitorsLoading ? (
                  <div className="p-3 border rounded-md text-sm text-muted-foreground">
                    Loading monitors...
                  </div>
                ) : monitors && monitors.length > 0 ? (
                  monitors.map((monitor) => (
                    <div
                      key={monitor.monitor_id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedMonitor === monitor.monitor_id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedMonitor(monitor.monitor_id)}
                    >
                      <div className="font-medium text-sm">{monitor.monitor_name}</div>
                      <div className="text-xs opacity-70">{monitor.total_records} records</div>
                      {monitor.change_count > 0 && (
                        <div className="text-xs text-orange-500">{monitor.change_count} changes</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-3 border rounded-md text-sm text-muted-foreground">
                    No monitors available. Generate sample data to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {monitors && monitors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monitor Statistics</CardTitle>
                <CardDescription>
                  Records by monitor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatsChart data={monitors} type="pie" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;