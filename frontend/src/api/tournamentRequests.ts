import { api } from './client.ts'

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface TournamentRequestDto {
  id: string
  name: string
  description: string
  status: RequestStatus
  response: string | null
  submittedAt: string
  reviewedAt: string | null
}

export interface OwnerRequestDto extends TournamentRequestDto {
  // null when the requester has since deleted their account
  requester: { id: string; username: string; email: string } | null
}

interface PageInfo {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export const tournamentRequestsApi = {
  create: (body: { name: string; description: string }) =>
    api.post<{ message: string; request: TournamentRequestDto }>('/api/tournament-requests', body),

  mine: (page: number, limit: number, signal?: AbortSignal) =>
    api.get<{ requests: TournamentRequestDto[] } & PageInfo>(
      `/api/tournament-requests/mine?page=${page}&limit=${limit}`,
      signal,
    ),

  withdraw: (id: string) =>
    api.patch<{ message: string; request: TournamentRequestDto }>(`/api/tournament-requests/${id}/withdraw`),
}

export interface DecisionResult {
  message: string
  request: TournamentRequestDto
  tournament: { id: string; name: string; slug: string; status: string } | null
}

export const ownerRequestsApi = {
  list: (status: RequestStatus | undefined, page: number, limit: number, signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.set('status', status)
    return api.get<{ requests: OwnerRequestDto[]; pendingCount: number } & PageInfo>(
      `/api/owner/tournament-requests?${params.toString()}`,
      signal,
    )
  },

  decide: (id: string, body: { decision: 'accept' | 'reject'; response?: string }) =>
    api.patch<DecisionResult>(`/api/owner/tournament-requests/${id}/decision`, body),
}
