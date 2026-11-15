import type { ClientSession, Types } from "mongoose";
import { Player, PlayerRegistration, Team } from "../models/index.js";
import type { IPlayer } from "../models/Player.js";
import type { TournamentDoc } from "../middleware/tournamentAccess.js";
import type { AccountType, PlayerStatus } from "../types/enums.js";
import { ApiError } from "../utils/ApiError.js";
import type { PlayerListQuery } from "../validators/registration.validators.js";
import type { RegistrationDoc } from "./registration.service.js";

export type PlayerDoc = IPlayer & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

export interface PlayerDto {
  id: string;
  registrationId: string;
  displayName: string;
  accountType: AccountType | null;
  isVerified: boolean;
  status: PlayerStatus;
  team: { id: string; name: string; shortCode: string } | null;
  soldPrice: number | null;
  createdAt: Date;
}

// Minimal shape returned right after a Player is created (the full PlayerDto needs joins).
export function toPlayerSummaryDto(p: PlayerDoc) {
  return { id: String(p._id), registrationId: String(p.registrationId), displayName: p.displayName, status: p.status };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Creates the Player for an accepted registration. MUST be called inside the same
// transaction (`session`) that accepts the registration, so the two can never disagree.
//
// It is an idempotent upsert keyed by the unique `registrationId`: running it twice
// (retry, race, leftover data) can never produce a second Player.
export async function createPlayerFromRegistration(registration: RegistrationDoc, session: ClientSession): Promise<PlayerDoc> {
  const player = await Player.findOneAndUpdate(
    { registrationId: registration._id },
    {
      $setOnInsert: {
        tournamentId: registration.tournamentId,
        userId: registration.userId,
        registrationId: registration._id,
        displayName: registration.displayName,
        status: "pending",
        teamId: null,
        soldPrice: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  ).lean<PlayerDoc>();

  if (!player) throw new Error("Player could not be created");
  return player;
}

// One page of a tournament's players plus per-status counts (counts ignore filters).
export async function listPlayers(tournamentId: Types.ObjectId, query: PlayerListQuery) {
  const { status, search, page, limit } = query;

  const filter: Record<string, unknown> = { tournamentId };
  if (status) filter.status = status;
  if (search) filter.displayName = { $regex: escapeRegex(search), $options: "i" }; // escaped: no regex injection

  const [players, total, grouped] = await Promise.all([
    Player.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<PlayerDoc[]>(),
    Player.countDocuments(filter),
    Player.aggregate<{ _id: PlayerStatus; count: number }>([
      { $match: { tournamentId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  // Account type / verification live on the registration; the team on the Team.
  const registrationIds = players.map((p) => p.registrationId);
  const teamIds = players.map((p) => p.teamId).filter((id): id is Types.ObjectId => id !== null);
  const [registrations, teams] = await Promise.all([
    registrationIds.length
      ? PlayerRegistration.find({ _id: { $in: registrationIds } }).select("accountType").lean<Pick<RegistrationDoc, "_id" | "accountType">[]>()
      : [],
    teamIds.length ? Team.find({ _id: { $in: teamIds } }).select("name shortCode").lean<{ _id: Types.ObjectId; name: string; shortCode: string }[]>() : [],
  ]);
  const regById = new Map(registrations.map((r) => [String(r._id), r]));
  const teamById = new Map(teams.map((t) => [String(t._id), t]));

  const counts: Record<PlayerStatus | "total", number> = { pending: 0, sold: 0, unsold: 0, withdrawn: 0, total: 0 };
  for (const row of grouped) {
    counts[row._id] = row.count;
    counts.total += row.count;
  }

  const items: PlayerDto[] = players.map((p) => {
    const reg = regById.get(String(p.registrationId));
    const team = p.teamId ? teamById.get(String(p.teamId)) : undefined;
    return {
      id: String(p._id),
      registrationId: String(p.registrationId),
      displayName: p.displayName,
      accountType: reg?.accountType.type ?? null,
      isVerified: reg?.accountType.isVerified ?? false,
      status: p.status,
      team: team ? { id: String(team._id), name: team.name, shortCode: team.shortCode } : null,
      soldPrice: p.soldPrice,
      createdAt: p.createdAt,
    };
  });

  return { items, total, counts, hasMore: page * limit < total };
}

// Organizer withdraws a player (for example, the person dropped out).
// Allowed for pending and unsold players only; sold players are part of a team.
export async function withdrawPlayer(tournament: TournamentDoc, playerId: string): Promise<PlayerDoc> {
  if (tournament.status === "completed" || tournament.status === "cancelled") {
    throw new ApiError(409, `Players cannot be changed in a ${tournament.status} tournament`);
  }

  // Atomic "eligible -> withdrawn": the filter carries both ownership (tournamentId)
  // and the allowed current statuses, so a concurrent sale or second click cannot slip through.
  const updated = await Player.findOneAndUpdate(
    { _id: playerId, tournamentId: tournament._id, status: { $in: ["pending", "unsold"] } },
    { $set: { status: "withdrawn" } },
    { new: true }
  ).lean<PlayerDoc>();
  if (updated) return updated;

  const existing = await Player.findOne({ _id: playerId, tournamentId: tournament._id }).select("status").lean<{ status: PlayerStatus }>();
  if (!existing) throw new ApiError(404, "Player not found in this tournament");
  if (existing.status === "sold") throw new ApiError(409, "A sold player cannot be withdrawn");
  throw new ApiError(409, "This player has already been withdrawn");
}
