import { api } from './client.ts'
import type { Timeline, TournamentStatus } from './tournaments.ts'

export interface PublicTournamentItem {
  slug: string
  name: string
  description: string
  status: Exclude<TournamentStatus, 'draft'>
  tournament_timeline: Timeline
}

export interface PublicTournamentDetail extends PublicTournamentItem {
  contactName: string | null
  teamConfig: { totalTeams: number | null; minPlayers: number | null; maxPlayers: number | null }
  pointsConfig: { win: number | null; loss: number | null; tie: number | null; noresult: number | null }
  createdAt: string
}

export const publicTournamentsApi = {
  list: (params: { search: string; status: string; page: number; limit: number }, signal?: AbortSignal) => {
    const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
    if (params.search) query.set('search', params.search)
    if (params.status) query.set('status', params.status)
    return api.get<{ tournaments: PublicTournamentItem[]; total: number; hasMore: boolean }>(
      `/api/public/tournaments?${query.toString()}`,
      signal,
    )
  },

  get: (slug: string, signal?: AbortSignal) =>
    api.get<{ tournament: PublicTournamentDetail }>(`/api/public/tournaments/${encodeURIComponent(slug)}`, signal),
}
