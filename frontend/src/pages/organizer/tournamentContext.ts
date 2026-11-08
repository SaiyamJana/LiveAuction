import { useOutletContext } from 'react-router-dom'
import type { TournamentDetail } from '../../api/tournaments.ts'

// Shared by TournamentHome (which loads the tournament once) and every tab page under it.
export interface TournamentOutletContext {
  tournament: TournamentDetail
  // Call with the fresh tournament returned by the API after a save / status change.
  onTournamentChange: (tournament: TournamentDetail) => void
}

export function useTournament(): TournamentOutletContext {
  return useOutletContext<TournamentOutletContext>()
}
