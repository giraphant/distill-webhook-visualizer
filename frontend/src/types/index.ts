// API Response Types
export interface WebhookData {
  id: number;
  timestamp: string;
  url: string;
  method: string;
  status_code: number;
  response_time: number;
  content_type: string;
  size: number;
  is_change: boolean;
  value?: number;
}

export interface MonitorSummary {
  url: string;
  method: string;
  count: number;
  avg_response_time: number;
  avg_value: number | null;
  status_codes: {[key: string]: number};
}

export interface MonitorStats {
  url: string;
  method: string;
  count: number;
  avg_response_time: number;
  avg_value?: number;
  status_codes: {[key: string]: number};
}

export interface ApiResponse<T> {
  data: T;
  status: string;
  message?: string;
}

// Chart Data Types
export interface ChartDataPoint {
  timestamp: string;
  value: number;
  is_change: boolean;
  url: string;
}

export interface StatsData {
  label: string;
  value: number;
  color?: string;
}

// Component Props Types
export interface ChartProps {
  data: any[];
  type?: 'line' | 'pie' | 'bar';
  title?: string;
  height?: number;
}

// Hook Types
export interface UseApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}