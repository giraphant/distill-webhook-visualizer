import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DataPoint {
  timestamp: string;
  value: number;
  is_change: boolean;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  color?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  title = "Monitor Data",
  color = "#2563eb"
}) => {
  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Format data for recharts
  const formattedData = data.map(point => ({
    ...point,
    displayTime: new Date(point.timestamp).toLocaleTimeString(),
    fullTime: formatTimestamp(point.timestamp)
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.fullTime}</p>
          <p className="text-primary">
            Value: <span className="font-semibold">{data.value}</span>
          </p>
          {data.is_change && (
            <p className="text-orange-600 text-sm">
              ⚠️ Change detected
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="displayTime"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: color }}
            name={title}
          />
          {/* Additional line for highlighting changes - removed complex dot function */}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;