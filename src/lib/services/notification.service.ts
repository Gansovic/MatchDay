/**
 * Notification Service
 * 
 * Handles fetching, creating, and managing user notifications
 * for the MatchDay player application.
 */

import { supabase } from '@/lib/supabase/client';

export type NotificationType = 
  | 'league_request_approved'
  | 'league_request_rejected'
  | 'team_joined_league'
  | 'team_left_league'
  | 'match_scheduled'
  | 'match_result';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export class NotificationService {
  /**
   * Get notifications for the current user
   */
  static async getUserNotifications(limit = 50): Promise<{ data: Notification[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'No authenticated user' };
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data, error };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { data: null, error };
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<{ count: number; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { count: 0, error: 'No authenticated user' };
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      return { count: count || 0, error };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { count: 0, error };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'No authenticated user' };
      }

      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
        p_user_id: user.id
      });

      return { success: !error, error };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error };
    }
  }

  /**
   * Mark all notifications as read for current user
   */
  static async markAllAsRead(): Promise<{ success: boolean; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'No authenticated user' };
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      return { success: !error, error };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error };
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  static subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void
  ) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onNotification(payload.new as Notification);
        }
      )
      .subscribe();
  }

  /**
   * Get notification icon based on type
   */
  static getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'league_request_approved':
        return '🎉';
      case 'league_request_rejected':
        return '📝';
      case 'team_joined_league':
        return '⚽';
      case 'team_left_league':
        return '📤';
      case 'match_scheduled':
        return '📅';
      case 'match_result':
        return '🏆';
      default:
        return '📢';
    }
  }

  /**
   * Get notification color based on type
   */
  static getNotificationColor(type: NotificationType): string {
    switch (type) {
      case 'league_request_approved':
      case 'team_joined_league':
        return 'text-green-400';
      case 'league_request_rejected':
        return 'text-yellow-400';
      case 'team_left_league':
        return 'text-red-400';
      case 'match_scheduled':
        return 'text-blue-400';
      case 'match_result':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  }
}