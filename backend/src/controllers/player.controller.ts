import { getValidated } from "../middleware/validate.js";
import { listPlayers, withdrawPlayer } from "../services/player.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { PlayerListQuery, PlayerParams } from "../validators/registration.validators.js";

// GET /api/tournaments/:id/players?status=&search=&page=&limit=   (organizer only)
export const list = asyncHandler(async (req, res) => {
  const query = getValidated<PlayerListQuery>(res, "query");
  const result = await listPlayers(req.tournament!._id, query);
  res.status(200).json({ players: result.items, counts: result.counts, page: query.page, limit: query.limit, total: result.total, hasMore: result.hasMore });
});

// PATCH /api/tournaments/:id/players/:playerId/withdraw   (organizer only)
export const withdraw = asyncHandler(async (req, res) => {
  const { playerId } = getValidated<PlayerParams>(res, "params");
  const player = await withdrawPlayer(req.tournament!, playerId);
  res.status(200).json({ message: "Player withdrawn.", player: { id: String(player._id), status: player.status } });
});
