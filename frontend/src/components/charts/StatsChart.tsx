import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MonitorStats {
  monitor_name: string;
  total_records: number;
  change_count: number;
  avg_value?: number | null;
}

interface StatsChartProps {
  data: MonitorStats[];
  type: 'bar' | 'pie';
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatsChart: React.FC<StatsChartProps> = ({ data, type }) => {
  if (type === 'pie') {
    const pieData = data.map((item, index) => ({
      name: item.monitor_name,
      value: item.total_records,
      fill: COLORS[index % COLORS.length]
    }));

    return (
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [value, 'Records']}
              labelFormatter={(label: any) => `Monitor: ${label}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="monitor_name"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: any, name: any) => [value, name]}
            labelFormatter={(label: any) => `Monitor: ${label}`}
          />
          <Bar dataKey="total_records" fill={COLORS[0]} name="Total Records" />
          <Bar dataKey="change_count" fill={COLORS[1]} name="Changes" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;