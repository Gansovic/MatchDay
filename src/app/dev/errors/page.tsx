'use client';

import { useState, useEffect } from 'react';
import { ErrorRecoveryService } from '@/lib/error/error-recovery.service';
import { errorHandler } from '@/lib/error/error-handler';

interface ErrorLog {
  timestamp: Date;
  error: Error;
  context?: any;
  recovered: boolean;
  recoveryAttempts: number;
}

export default function ErrorMonitoringDashboard() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [circuitBreakerStatus, setCircuitBreakerStatus] = useState<Map<string, any>>(new Map());
  const [filter, setFilter] = useState<'all' | 'recovered' | 'unrecovered'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const errorRecovery = ErrorRecoveryService.getInstance();

  useEffect(() => {
    loadErrorData();
    
    if (autoRefresh) {
      const interval = setInterval(loadErrorData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadErrorData = () => {
    setErrorLogs(errorRecovery.getErrorLogs());
    setCircuitBreakerStatus(errorRecovery.getCircuitBreakerStatus());
  };

  const clearLogs = () => {
    errorRecovery.clearErrorLogs();
    loadErrorData();
  };

  const triggerTestError = () => {
    try {
      throw new Error('Test error for monitoring dashboard');
    } catch (error) {
      errorHandler.handle(error, {
        metadata: { source: 'monitoring-dashboard', test: true }
      });
      setTimeout(loadErrorData, 100);
    }
  };

  const filteredErrors = errorLogs.filter(log => {
    // Apply filter
    if (filter === 'recovered' && !log.recovered) return false;
    if (filter === 'unrecovered' && log.recovered) return false;
    
    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return log.error.message.toLowerCase().includes(searchLower) ||
             log.error.name.toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  const getErrorTypeColor = (error: Error) => {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) return 'text-blue-600';
    if (message.includes('auth')) return 'text-purple-600';
    if (message.includes('database')) return 'text-red-600';
    if (message.includes('validation')) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Error Monitoring Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time monitoring of application errors and recovery status
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={loadErrorData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Refresh
              </button>
              
              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear Logs
              </button>
              
              <button
                onClick={triggerTestError}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Test Error
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                Auto Refresh
              </label>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Errors</option>
              <option value="recovered">Recovered</option>
              <option value="unrecovered">Unrecovered</option>
            </select>

            <input
              type="text"
              placeholder="Search errors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 flex-1 max-w-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Error Statistics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Error Statistics
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Errors</span>
                <span className="font-semibold">{errorLogs.length}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Recovered</span>
                <span className="font-semibold text-green-600">
                  {errorLogs.filter(log => log.recovered).length}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Unrecovered</span>
                <span className="font-semibold text-red-600">
                  {errorLogs.filter(log => !log.recovered).length}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Recovery Rate</span>
                <span className="font-semibold">
                  {errorLogs.length > 0 
                    ? Math.round((errorLogs.filter(log => log.recovered).length / errorLogs.length) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Circuit Breaker Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Circuit Breakers
            </h2>
            
            {Array.from(circuitBreakerStatus.entries()).length === 0 ? (
              <p className="text-gray-500 text-sm">No circuit breakers active</p>
            ) : (
              <div className="space-y-3">
                {Array.from(circuitBreakerStatus.entries()).map(([key, status]) => (
                  <div key={key} className="border rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium truncate" title={key}>
                        {key.length > 20 ? `${key.substring(0, 20)}...` : key}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        status.isOpen ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {status.isOpen ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Failures: {status.failures}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Errors Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Error Types
            </h2>
            
            {(() => {
              const errorTypes = errorLogs.reduce((acc, log) => {
                const type = log.error.name || 'Unknown';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              return Object.keys(errorTypes).length === 0 ? (
                <p className="text-gray-500 text-sm">No errors logged</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(errorTypes)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-sm text-gray-600">{type}</span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Error Logs */}
        <div className="bg-white rounded-lg shadow-sm mt-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Error Logs ({filteredErrors.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {filteredErrors.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No errors found matching your criteria
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attempts
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredErrors.slice(0, 50).map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.timestamp.toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getErrorTypeColor(log.error)}`}>
                          {log.error.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-md truncate" title={log.error.message}>
                          {log.error.message}
                        </div>
                        {log.context && (
                          <div className="text-xs text-gray-500 mt-1">
                            {JSON.stringify(log.context).substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          log.recovered 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.recovered ? 'Recovered' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.recoveryAttempts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Development Error Monitoring Dashboard - 
            Last updated: {new Date().toLocaleString()}
          </p>
          <p className="mt-1">
            This dashboard is only available in development mode
          </p>
        </div>
      </div>
    </div>
  );
}