import { api } from './client.ts'

export type UserRole = 'owner' | 'user'

// Same shape as the backend's safe user object (no hashes, no counters).
export interface AuthUser {
  id: string
  username: string
  email: string
  role: UserRole
  createdAt: string
}

export interface RegisterInput {
  username: string
  email: string
  password: string
  confirmPassword: string
  secureCode: string
}

export interface MessageResponse {
  message: string
}

export const authApi = {
  register: (body: RegisterInput) =>
    api.post<MessageResponse & { user: AuthUser }>('/api/auth/register', body),

  login: (body: { email: string; password: string }) =>
    api.post<{ user: AuthUser }>('/api/auth/login', body),

  logout: () => api.post<MessageResponse>('/api/auth/logout'),

  me: (signal?: AbortSignal) => api.get<{ user: AuthUser }>('/api/auth/me', signal),

  resetPassword: (body: { email: string; secureCode: string; newPassword: string }) =>
    api.post<MessageResponse>('/api/auth/reset-password', body),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.post<MessageResponse>('/api/auth/change-password', body),

  deleteAccount: (body: { secureCode: string; confirmation: string }) =>
    api.delete<MessageResponse>('/api/auth/account', body),
}

export const ownerApi = {
  ping: () => api.get<{ message: string; role: string }>('/api/owner/ping'),
}