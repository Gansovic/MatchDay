/**
 * Recent Activity Component
 * 
 * Displays recent notifications and activity on the player dashboard
 */

'use client';

import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationService } from '@/lib/services/notification.service';
import { Bell, Loader2, AlertCircle } from 'lucide-react';

interface RecentActivityProps {
  className?: string;
  limit?: number;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ 
  className = '', 
  limit = 5 
}) => {
  const { notifications, isLoading, error } = useNotifications();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const recentNotifications = notifications.slice(0, limit);

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-500 dark:text-gray-400">Loading activity...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="flex items-center justify-center py-8 text-red-500">
          <AlertCircle className="w-6 h-6" />
          <span className="ml-2">Failed to load activity</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>

      {recentNotifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Your team and league updates will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                notification.read
                  ? 'bg-gray-50 dark:bg-gray-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-lg">
                  {NotificationService.getNotificationIcon(notification.type)}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-medium ${
                    notification.read 
                      ? 'text-gray-700 dark:text-gray-300' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {notification.title}
                  </h4>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                </div>
                <p className={`text-sm mt-1 ${
                  notification.read 
                    ? 'text-gray-500 dark:text-gray-400' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {formatTimeAgo(notification.created_at)}
                </p>
              </div>
            </div>
          ))}

          {notifications.length > limit && (
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {limit} of {notifications.length} notifications
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Click the bell icon to see all notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};