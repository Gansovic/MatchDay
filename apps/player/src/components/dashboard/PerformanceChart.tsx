/**
 * PerformanceChart Component
 *
 * Line/Area chart showing player performance over time (Playtomic-style).
 * Displays win rate trends, goals per game, or team performance.
 * All data from database, no mock data.
 */

'use client';

import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';

export interface PerformanceDataPoint {
  date: string;
  matchDate: Date;
  winRate: number;
  goals: number;
  rating: number;
  label: string; // e.g., "Dec 15"
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  isLoading?: boolean;
}

type MetricType = 'winRate' | 'goals' | 'rating';

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  isLoading = false
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('winRate');

  const metrics = [
    { id: 'winRate' as MetricType, label: 'Win Rate', color: '#10B981', unit: '%' },
    { id: 'goals' as MetricType, label: 'Goals', color: '#8B5CF6', unit: '' },
    { id: 'rating' as MetricType, label: 'Player Rating', color: '#3B82F6', unit: '' }
  ];

  const selectedMetricConfig = metrics.find(m => m.id === selectedMetric);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Trend</h3>
        </div>
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No performance data available yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Play more matches to see your performance trends
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {data.label}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold" style={{ color: selectedMetricConfig?.color }}>
              {selectedMetric === 'goals' ? payload[0].value : payload[0].value.toFixed(1)}{selectedMetricConfig?.unit}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
      {/* Header with metric toggles */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Trend</h3>
        </div>

        {/* Metric Selector */}
        <div className="flex gap-2">
          {metrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedMetric === metric.id
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={selectedMetricConfig?.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={selectedMetricConfig?.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="label"
              stroke="#9CA3AF"
              className="text-xs"
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis
              stroke="#9CA3AF"
              className="text-xs"
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={selectedMetric}
              stroke={selectedMetricConfig?.color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMetric)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      {data.length > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedMetric === 'goals'
                ? data[data.length - 1][selectedMetric]
                : data[data.length - 1][selectedMetric].toFixed(1)
              }{selectedMetricConfig?.unit}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedMetric === 'goals'
                ? Math.round(data.reduce((sum, d) => sum + d[selectedMetric], 0) / data.length)
                : (data.reduce((sum, d) => sum + d[selectedMetric], 0) / data.length).toFixed(1)
              }{selectedMetricConfig?.unit}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Peak</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedMetric === 'goals'
                ? Math.max(...data.map(d => d[selectedMetric]))
                : Math.max(...data.map(d => d[selectedMetric])).toFixed(1)
              }{selectedMetricConfig?.unit}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
