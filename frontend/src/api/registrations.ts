import { api } from './client.ts'

export type RegistrationStatus = 'pending' | 'accepted' | 'rejected'
export type AccountType = 'star' | 'gem'
export type PlayerStatus = 'pending' | 'sold' | 'unsold' | 'withdrawn'

export interface RegistrationDto {
  id: string
  tournamentId: string
  actualName: string
  displayName: string
  accountType: AccountType
  isVerified: boolean
  contactNumber: string // international format, e.g. +919876543210
  contactCountry: string // ISO 3166-1 alpha-2, e.g. IN
  wantsCaptain: boolean
  status: RegistrationStatus
  response: string | null
  submittedAt: string
  updatedAt: string
}

export interface OrganizerRegistrationDto extends RegistrationDto {
  username: string | null // null when the player deleted their account
}

// What the player may send. userId, status and isVerified are never part of it.
export interface RegistrationInput {
  actualName: string
  displayName: string
  accountType: AccountType
  contactNumber: string
  contactCountry: string
  wantsCaptain: boolean
}

export interface MyRegistrationResponse {
  registration: RegistrationDto | null
  registrationOpen: boolean
  closedReason: string | null
  isOrganizer: boolean
}

export type RegistrationCounts = Record<RegistrationStatus | 'total', number>
export type PlayerCounts = Record<PlayerStatus | 'total', number>

interface PageInfo {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface PlayerDto {
  id: string
  registrationId: string
  displayName: string
  accountType: AccountType | null
  isVerified: boolean
  status: PlayerStatus
  team: { id: string; name: string; shortCode: string } | null
  soldPrice: number | null
  createdAt: string
}

export const registrationsApi = {
  mine: (tournamentId: string, signal?: AbortSignal) =>
    api.get<MyRegistrationResponse>(`/api/tournaments/${tournamentId}/registrations/mine`, signal),

  create: (tournamentId: string, body: RegistrationInput) =>
    api.post<{ message: string; registration: RegistrationDto }>(`/api/tournaments/${tournamentId}/registrations`, body),

  resubmit: (tournamentId: string, body: RegistrationInput) =>
    api.put<{ message: string; registration: RegistrationDto }>(`/api/tournaments/${tournamentId}/registrations/mine`, body),

  // Organizer
  list: (
    tournamentId: string,
    params: { status?: RegistrationStatus; search: string; page: number; limit: number },
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
    if (params.status) query.set('status', params.status)
    if (params.search) query.set('search', params.search)
    return api.get<{ registrations: OrganizerRegistrationDto[]; counts: RegistrationCounts } & PageInfo>(
      `/api/tournaments/${tournamentId}/registrations?${query.toString()}`,
      signal,
    )
  },

  decide: (
    tournamentId: string,
    registrationId: string,
    body: { decision: 'accept' | 'reject'; response?: string; isVerified?: boolean },
  ) =>
    api.patch<{ message: string; registration: OrganizerRegistrationDto; player: { id: string } | null }>(
      `/api/tournaments/${tournamentId}/registrations/${registrationId}/decision`,
      body,
    ),

  exportCsv: (tournamentId: string) => api.download(`/api/tournaments/${tournamentId}/export/registrations.csv`),
}

export const playersApi = {
  list: (
    tournamentId: string,
    params: { status?: PlayerStatus; search: string; page: number; limit: number },
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
    if (params.status) query.set('status', params.status)
    if (params.search) query.set('search', params.search)
    return api.get<{ players: PlayerDto[]; counts: PlayerCounts } & PageInfo>(
      `/api/tournaments/${tournamentId}/players?${query.toString()}`,
      signal,
    )
  },

  withdraw: (tournamentId: string, playerId: string) =>
    api.patch<{ message: string; player: { id: string; status: PlayerStatus } }>(
      `/api/tournaments/${tournamentId}/players/${playerId}/withdraw`,
    ),

  exportCsv: (tournamentId: string) => api.download(`/api/tournaments/${tournamentId}/export/players.csv`),
}
