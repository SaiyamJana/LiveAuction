import { api } from './client.ts'

export type TournamentStatus =
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'auction'
  | 'tournament_in_progress'
  | 'completed'
  | 'cancelled'

export type Visibility = 'public' | 'private'

export interface Timeline {
  registrationStart: string | null
  registrationClose: string | null
  auctionStart: string | null
  tournamentStart: string | null
}

export interface TournamentSummary {
  id: string
  name: string
  slug: string
  description: string
  visibility: Visibility
  status: TournamentStatus
  tournament_timeline: Timeline
  createdAt: string
  updatedAt: string
}

export interface NextAction {
  to: TournamentStatus
  allowed: boolean
  blockers: string[]
}

export interface TournamentDetail extends TournamentSummary {
  contact: { name: string | null; phone: string | null }
  teamConfig: { totalTeams: number | null; minPlayers: number | null; maxPlayers: number | null }
  pointsConfig: { win: number | null; loss: number | null; tie: number | null; noresult: number | null }
  locks: { teamAndPoints: boolean }
  nextActions: NextAction[]
}

// Same shape the PATCH endpoint accepts. Every key is optional (partial update); null clears a date.
export interface UpdateTournamentInput {
  name?: string
  description?: string
  visibility?: Visibility
  contact?: { name?: string; phone?: string }
  teamConfig?: { totalTeams?: number; minPlayers?: number; maxPlayers?: number }
  pointsConfig?: { win?: number; loss?: number; tie?: number; noresult?: number }
  tournament_timeline?: Partial<Record<keyof Timeline, string | null>>
}

export const tournamentsApi = {
  mine: (page: number, limit: number, signal?: AbortSignal) =>
    api.get<{ tournaments: TournamentSummary[]; page: number; limit: number; total: number; hasMore: boolean }>(
      `/api/tournaments/mine?page=${page}&limit=${limit}`,
      signal,
    ),

  get: (id: string, signal?: AbortSignal) => api.get<{ tournament: TournamentDetail }>(`/api/tournaments/${id}`, signal),

  update: (id: string, body: UpdateTournamentInput) =>
    api.patch<{ message: string; tournament: TournamentDetail }>(`/api/tournaments/${id}`, body),

  changeStatus: (id: string, status: TournamentStatus, reason?: string) =>
    api.patch<{ message: string; tournament: TournamentDetail }>(`/api/tournaments/${id}/status`, { status, reason }),
}
