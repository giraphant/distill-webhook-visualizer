import axios from 'axios';

// API base URL - can be configured via environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Types
export interface MonitoringData {
  id: number;
  monitor_id: string;
  monitor_name: string;
  url: string;
  value: number | null;
  text_value: string | null;
  status: string;
  timestamp: string;
  webhook_received_at: string;
  is_change: boolean;
  change_type: string | null;
  previous_value: number | null;
}

export interface MonitorSummary {
  monitor_id: string;
  monitor_name: string;
  url: string;
  total_records: number;
  latest_value: number | null;
  latest_timestamp: string;
  min_value: number | null;
  max_value: number | null;
  avg_value: number | null;
  change_count: number;
}

export interface ChartData {
  monitor_id: string;
  monitor_name: string;
  url: string;
  data: Array<{
    timestamp: string;
    value: number;
    status: string;
    is_change: boolean;
    url: string;
  }>;
  summary: {
    total_points: number;
    date_range: string;
    value_range: {
      min: number | null;
      max: number | null;
      avg: number | null;
    };
    changes_detected: number;
    latest_value: number | null;
    latest_timestamp: string | null;
  };
}

export interface HealthStatus {
  status: string;
  service: string;
  version?: string;
}

export interface WebhookStatus {
  status: string;
  webhook_endpoint: string;
  statistics: {
    total_records: number;
    unique_monitors: number;
    latest_record: string | null;
  };
}

// API Methods
export const apiService = {
  // Health check
  async getHealth(): Promise<HealthStatus> {
    const response = await api.get('/health');
    return response.data;
  },

  // Webhook status
  async getWebhookStatus(): Promise<WebhookStatus> {
    const response = await api.get('/webhook/status');
    return response.data;
  },

  // Get monitoring data with optional filters
  async getMonitoringData(params?: {
    monitor_id?: string;
    limit?: number;
    offset?: number;
    start_date?: string;
    end_date?: string;
    order_by?: string;
    order_dir?: string;
  }): Promise<MonitoringData[]> {
    const response = await api.get('/api/data', { params });
    return response.data;
  },

  // Get monitor summaries
  async getMonitorSummaries(): Promise<MonitorSummary[]> {
    const response = await api.get('/api/monitors');
    return response.data;
  },

  // Get chart data for specific monitor
  async getChartData(monitorId: string, days: number = 7): Promise<ChartData> {
    const response = await api.get(`/api/chart-data/${monitorId}`, {
      params: { days }
    });
    return response.data;
  },

  // Generate sample data
  async generateSampleData(): Promise<{ status: string; message: string }> {
    const response = await api.post('/api/generate-sample');
    return response.data;
  },

  // Clear all data
  async clearAllData(): Promise<{ status: string; message: string }> {
    const response = await api.delete('/api/clear-all');
    return response.data;
  },

  // Send test webhook
  async sendTestWebhook(data: any): Promise<{ status: string; message: string }> {
    const response = await api.post('/webhook/distill', data);
    return response.data;
  },

  // Execute command (for deployment management)
  async executeCommand(command: string): Promise<{
    success: boolean;
    output: string;
    error?: string;
  }> {
    const response = await api.post('/api/execute', { command });
    return response.data;
  },
};

export default apiService;