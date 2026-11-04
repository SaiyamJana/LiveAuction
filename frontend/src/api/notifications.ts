import { api } from './client.ts'

export interface NotificationItem {
  id: string
  type: string
  body: string
  readAt: string | null
  createdAt: string
}

export interface NotificationsPage {
  notifications: NotificationItem[]
  unreadCount: number
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export const notificationsApi = {
  list: (page: number, limit: number, signal?: AbortSignal) =>
    api.get<NotificationsPage>(`/api/notifications?page=${page}&limit=${limit}`, signal),

  markRead: (id: string) =>
    api.patch<{ notification: NotificationItem; unreadCount: number }>(`/api/notifications/${id}/read`),

  markAllRead: () => api.patch<{ updated: number; unreadCount: number }>('/api/notifications/read-all'),
}
