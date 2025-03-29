import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useContext } from 'react';
import { UserContext } from '@/contexts/profile-context';
import http from '@/lib/http';
import { useSocket } from '@/hooks/use-socket';
import { toast } from '@/hooks/use-toast';

// Định nghĩa kiểu dữ liệu cho thông báo
export interface Notification {
  _id: string;
  user_id: string;
  content: string;
  type: 'task' | 'assign' | 'event' | 'message' | 'project' | string;
  is_read: boolean;
  reference_id?: string;
  reference_type?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

// Định nghĩa kiểu dữ liệu cho response từ API
export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  count: number;
}

// Kiểm tra đường dẫn API - đảm bảo đúng với backend
const API_PATH = 'notifications'; // Không thêm 'api/' vì http.ts có thể đã xử lý

export const useNotification = () => {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { user } = useContext(UserContext) || {};

  // Lắng nghe sự kiện thông báo mới từ socket
  useEffect(() => {
    if (!socket || !user?._id) return;

    // Lắng nghe sự kiện nhận thông báo mới
    const handleNewNotification = (notification: Notification) => {
      console.log('[DEBUG] Received new notification:', notification);

      // Xử lý thông báo dựa trên loại
      if (notification.type === 'project') {
        console.log('[DEBUG] Received project notification');
        // Có thể thêm xử lý đặc biệt cho thông báo project nếu cần
      }

      // Cập nhật cache của danh sách thông báo
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications'],
        (oldData) => {
          if (!oldData) return { notifications: [notification], total: 1, page: 1, limit: 10 };

          // Kiểm tra xem thông báo đã tồn tại chưa
          const exists = oldData.notifications.some(n => n._id === notification._id);
          if (exists) {
            console.log('[DEBUG] Notification already exists, not adding');
            return oldData;
          }

          console.log('[DEBUG] Adding new notification to cache');
          return {
            ...oldData,
            notifications: [notification, ...oldData.notifications],
            total: oldData.total + 1,
          };
        }
      );

      // Cập nhật số lượng thông báo chưa đọc
      queryClient.setQueryData<UnreadCountResponse>(
        ['unread-count'],
        (oldData) => {
          if (!oldData) return { count: 1 };
          console.log(`[DEBUG] Updating unread count: ${oldData.count} -> ${oldData.count + 1}`);
          return { count: oldData.count + 1 };
        }
      );

      // Buộc React Query cập nhật UI
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });

      // Hiển thị toast thông báo nếu cần
      if (notification.type === 'project') {
        // Nếu bạn có thư viện toast, có thể hiển thị thông báo
        toast({
          title: 'Thông báo mới',
          description: notification.content,
          duration: 5000,
        });
      }
    };

    socket.on('new_notification', handleNewNotification);

    // Cleanup khi component unmount
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, user?._id, queryClient]);

  // Lấy danh sách thông báo
  const getNotifications = (page = 1, limit = 10) => {
    return useQuery<NotificationsResponse, Error>({
      queryKey: ['notifications', page, limit],
      queryFn: async (): Promise<NotificationsResponse> => {
        try {
          console.log(`[DEBUG] Calling API: ${API_PATH}?page=${page}&limit=${limit}`);
          const response = await http.get(`${API_PATH}?page=${page}&limit=${limit}`);
          console.log('[DEBUG] Notifications API response:', response);

          if (response.payload) {
            console.log('[DEBUG] Notifications payload:', response.payload.result);
            return response.payload.result as NotificationsResponse;
          }
          return { notifications: [], total: 0, page, limit };
        } catch (error) {
          console.error('[DEBUG] Error fetching notifications:', error);
          return { notifications: [], total: 0, page, limit };
        }
      },
      enabled: !!user?._id,
    });
  };

  // Lấy số lượng thông báo chưa đọc
  const getUnreadCount = () => {
    return useQuery<UnreadCountResponse, Error>({
      queryKey: ['unread-count'],
      queryFn: async (): Promise<UnreadCountResponse> => {
        try {
          const response = await http.get(`${API_PATH}/unread-count`);

          if (response.payload) {
            console.log('[DEBUG] Unread count payload:', response.payload);
            return response.payload.result as UnreadCountResponse;
          }

          console.log('[DEBUG] No payload found, returning default count');
          return { count: 0 };
        } catch (error) {
          console.error('[DEBUG] Error fetching unread count:', error);
          return { count: 0 };
        }
      },
      enabled: !!user?._id,
      staleTime: 1000 * 60,
    });
  };

  // Đánh dấu thông báo đã đọc
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      try {
        console.log(`[DEBUG] Marking notification as read: ${notificationId}`);
        const response = await http.patch(`${API_PATH}/read`, {
          notification_id: notificationId
        });
        console.log('[DEBUG] Mark as read response:', response);
        return { id: notificationId, response };
      } catch (error) {
        console.error('[DEBUG] Error marking notification as read:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const notificationId = data.id;
      console.log(`[DEBUG] Successfully marked notification as read: ${notificationId}`);

      // Cập nhật cache của danh sách thông báo
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications'],
        (oldData) => {
          if (!oldData) return oldData;
          console.log('[DEBUG] Updating notifications cache after mark as read');

          const updatedNotifications = oldData.notifications.map((notification) =>
            notification._id === notificationId
              ? { ...notification, is_read: true }
              : notification
          );

          return {
            ...oldData,
            notifications: updatedNotifications
          };
        }
      );

      // Cập nhật số lượng thông báo chưa đọc
      queryClient.setQueryData<UnreadCountResponse>(
        ['unread-count'],
        (oldData) => {
          if (!oldData) return { count: 0 };
          const newCount = Math.max(0, oldData.count - 1);
          console.log(`[DEBUG] Updating unread count: ${oldData.count} -> ${newCount}`);
          return { count: newCount };
        }
      );

      // Buộc React Query cập nhật UI bằng cách invalidate queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error) => {
      console.error('[DEBUG] Error in markAsRead mutation:', error);
    }
  });

  // Đánh dấu tất cả thông báo đã đọc
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      try {
        console.log('[DEBUG] Marking all notifications as read');
        const response = await http.patch(`${API_PATH}/read-all`, {});
        console.log('[DEBUG] Mark all as read response:', response);
        return response;
      } catch (error) {
        console.error('[DEBUG] Error marking all notifications as read:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[DEBUG] Successfully marked all notifications as read');

      // Cập nhật cache của danh sách thông báo
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications'],
        (oldData) => {
          if (!oldData) return oldData;
          console.log('[DEBUG] Updating notifications cache after mark all as read');

          // Cập nhật tất cả thông báo thành đã đọc
          const updatedNotifications = oldData.notifications.map(notification => ({
            ...notification,
            is_read: true
          }));

          return {
            ...oldData,
            notifications: updatedNotifications
          };
        }
      );

      // Đặt số lượng thông báo chưa đọc về 0
      queryClient.setQueryData<UnreadCountResponse>(
        ['unread-count'],
        { count: 0 }
      );

      // Buộc React Query cập nhật UI bằng cách invalidate queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error) => {
      console.error('[DEBUG] Error in markAllAsRead mutation:', error);
    }
  });

  // Xóa thông báo
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      try {
        console.log(`[DEBUG] Deleting notification: ${notificationId}`);
        const response = await http.delete(`${API_PATH}`, {
          body: { notification_id: notificationId }
        });
        console.log('[DEBUG] Delete notification response:', response);
        return { id: notificationId, response };
      } catch (error) {
        console.error('[DEBUG] Error deleting notification:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const notificationId = data.id;
      console.log(`[DEBUG] Successfully deleted notification: ${notificationId}`);

      // Lưu trữ thông tin về thông báo bị xóa trước khi cập nhật cache
      const notifications = queryClient.getQueryData<NotificationsResponse>(['notifications']);
      const deletedNotification = notifications?.notifications.find(
        (n) => n._id === notificationId
      );
      const wasUnread = deletedNotification && !deletedNotification.is_read;

      // Cập nhật cache của danh sách thông báo
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications'],
        (oldData) => {
          if (!oldData) return oldData;
          console.log('[DEBUG] Updating notifications cache after delete');

          return {
            ...oldData,
            notifications: oldData.notifications.filter(
              (notification) => notification._id !== notificationId
            ),
            total: Math.max(0, oldData.total - 1)
          };
        }
      );

      // Cập nhật số lượng thông báo chưa đọc nếu thông báo bị xóa chưa đọc
      if (wasUnread) {
        queryClient.setQueryData<UnreadCountResponse>(
          ['unread-count'],
          (oldData) => {
            if (!oldData) return { count: 0 };
            const newCount = Math.max(0, oldData.count - 1);
            console.log(`[DEBUG] Updating unread count after delete: ${oldData.count} -> ${newCount}`);
            return { count: newCount };
          }
        );
      }

      // Buộc React Query cập nhật UI bằng cách invalidate queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error) => {
      console.error('[DEBUG] Error in deleteNotification mutation:', error);
    }
  });

  // Xóa tất cả thông báo
  const deleteAllNotifications = useMutation({
    mutationFn: async () => {
      try {
        console.log('[DEBUG] Deleting all notifications');
        // Kiểm tra xem API của bạn có endpoint này không
        const response = await http.delete(`${API_PATH}/all`);
        console.log('[DEBUG] Delete all notifications response:', response);
        return response;
      } catch (error) {
        console.error('[DEBUG] Error deleting all notifications:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[DEBUG] Successfully deleted all notifications');

      // Cập nhật cache của danh sách thông báo
      queryClient.setQueryData<NotificationsResponse>(
        ['notifications'],
        { notifications: [], total: 0, page: 1, limit: 10 }
      );

      // Đặt số lượng thông báo chưa đọc về 0
      queryClient.setQueryData<UnreadCountResponse>(
        ['unread-count'],
        { count: 0 }
      );

      // Buộc React Query cập nhật UI bằng cách invalidate queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
    onError: (error) => {
      console.error('[DEBUG] Error in deleteAllNotifications mutation:', error);
    }
  });

  return {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
};

export default useNotification;