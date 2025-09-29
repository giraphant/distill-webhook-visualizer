import { useState, useEffect, useCallback } from 'react';
import { apiService, MonitoringData, MonitorSummary, ChartData, HealthStatus, WebhookStatus } from '@/services/api';

// Generic hook for API calls
export function useApiCall<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Specific hooks for different API endpoints
export function useHealth() {
  return useApiCall(() => apiService.getHealth());
}

export function useWebhookStatus() {
  return useApiCall(() => apiService.getWebhookStatus());
}

export function useMonitoringData(params?: {
  monitor_id?: string;
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
  order_by?: string;
  order_dir?: string;
}) {
  return useApiCall(() => apiService.getMonitoringData(params), [JSON.stringify(params)]);
}

export function useMonitorSummaries() {
  return useApiCall(() => apiService.getMonitorSummaries());
}

export function useChartData(monitorId: string | null, days: number = 7) {
  return useApiCall(
    () => monitorId ? apiService.getChartData(monitorId, days) : Promise.resolve(null),
    [monitorId, days]
  );
}

// Hook for actions (non-GET requests)
export function useApiActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = useCallback(async <T>(
    action: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await action();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSampleData = useCallback(() => {
    return executeAction(() => apiService.generateSampleData());
  }, [executeAction]);

  const clearAllData = useCallback(() => {
    return executeAction(() => apiService.clearAllData());
  }, [executeAction]);

  const sendTestWebhook = useCallback((data: any) => {
    return executeAction(() => apiService.sendTestWebhook(data));
  }, [executeAction]);

  const executeCommand = useCallback((command: string) => {
    return executeAction(() => apiService.executeCommand(command));
  }, [executeAction]);

  return {
    loading,
    error,
    generateSampleData,
    clearAllData,
    sendTestWebhook,
    executeCommand,
  };
}

export default {
  useHealth,
  useWebhookStatus,
  useMonitoringData,
  useMonitorSummaries,
  useChartData,
  useApiActions,
};