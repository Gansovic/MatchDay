/**
 * useNotifications Hook
 * 
 * Custom React hook for managing user notifications with real-time updates
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { NotificationService, Notification } from '@/lib/services/notification.service';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Fetch notifications and unread count in parallel
      const [notificationsResult, unreadResult] = await Promise.all([
        NotificationService.getUserNotifications(),
        NotificationService.getUnreadCount()
      ]);

      if (notificationsResult.error) {
        throw new Error(notificationsResult.error.message || 'Failed to fetch notifications');
      }

      if (unreadResult.error) {
        console.warn('Failed to fetch unread count:', unreadResult.error);
      }

      setNotifications(notificationsResult.data || []);
      setUnreadCount(unreadResult.count);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const result = await NotificationService.markAsRead(notificationId);
    
    if (result.success) {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } else {
      console.error('Failed to mark notification as read:', result.error);
    }
    
    return result.success;
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const result = await NotificationService.markAllAsRead();
    
    if (result.success) {
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } else {
      console.error('Failed to mark all notifications as read:', result.error);
    }
    
    return result.success;
  }, []);

  // Handle new notification from real-time subscription
  const handleNewNotification = useCallback((newNotification: Notification) => {
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  // Initial fetch and real-time subscription
  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription if user is authenticated
    if (user?.id) {
      const subscription = NotificationService.subscribeToNotifications(
        user.id,
        handleNewNotification
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id, fetchNotifications, handleNewNotification]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications
  };
};