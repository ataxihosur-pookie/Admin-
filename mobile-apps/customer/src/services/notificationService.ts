import { supabase } from '../utils/supabase';

export class NotificationService {
  // Send admin booking notification for special ride types - COMPLETELY REWRITTEN
  async sendAdminBookingNotification(bookingData: {
    id: string;
    booking_type: string;
    customer_id: string;
    customer_name: string;
    customer_phone: string | null;
    pickup_address: string;
    destination_address: string | null;
    vehicle_type: string;
    pickup_latitude: number;
    pickup_longitude: number;
    destination_latitude: number;
    destination_longitude: number;
    pickup_landmark?: string;
    destination_landmark?: string;
    rental_hours?: number;
    special_requirements?: string;
    fare_amount: number | null;
  }) {
    try {
      console.log('🚀 Creating scheduled booking for special trip:', bookingData.booking_type);
      
      // Get Supabase configuration
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase configuration');
        return;
      }

      console.log('📡 Calling notify-booking edge function...');

      const response = await fetch(`${supabaseUrl}/functions/v1/notify-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          customer_id: bookingData.customer_id,
          pickup_latitude: bookingData.pickup_latitude,
          pickup_longitude: bookingData.pickup_longitude,
          pickup_address: bookingData.pickup_address,
          destination_latitude: bookingData.destination_latitude,
          destination_longitude: bookingData.destination_longitude,
          destination_address: bookingData.destination_address,
          pickup_landmark: bookingData.pickup_landmark,
          destination_landmark: bookingData.destination_landmark,
          booking_type: bookingData.booking_type,
          vehicle_type: bookingData.vehicle_type,
          rental_hours: bookingData.rental_hours,
          estimated_fare: bookingData.fare_amount,
          special_requirements: bookingData.special_requirements
        })
      });

      console.log('📊 Response status:', response.status);

      const result = await response.json();
      console.log('📋 Response data:', result);

      if (!response.ok || !result.success) {
        console.error('❌ Failed to create scheduled booking:', result.error || `HTTP ${response.status}`);
        return;
      }

      console.log('✅ Scheduled booking created successfully:', result.message);
      
    } catch (error) {
      console.error('❌ Error creating scheduled booking:', error);
    }
  }

  // Send notification to specific user
  async sendNotification(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          status: 'unread'
        });

      if (error) {
        console.error('Error sending notification:', error);
        return false;
      }

      console.log('✅ Notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return false;
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return false;
    }
  }

  // Subscribe to user notifications
  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();