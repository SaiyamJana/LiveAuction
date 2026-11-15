import type { Response } from "express";
import type { Types } from "mongoose";
import { Player, PlayerRegistration, Team, User } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toCsv } from "../utils/csv.js";
import type { CsvColumn } from "../utils/csv.js";
import type { PlayerDoc } from "../services/player.service.js";
import type { RegistrationDoc } from "../services/registration.service.js";

const yesNo = (value: boolean): string => (value ? "Yes" : "No");

// The tournament comes from the authorized req.tournament, so only ITS records are exported.
// Slugs only contain a-z, 0-9 and "-", so the filename is header-safe.
function sendCsv(res: Response, slug: string, kind: string, csv: string): void {
  const date = new Date().toISOString().slice(0, 10);
  res
    .status(200)
    .set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-${kind}-${date}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    })
    .send(csv);
}

type RegistrationRow = RegistrationDoc & { username: string };

const REGISTRATION_COLUMNS: CsvColumn<RegistrationRow>[] = [
  { header: "Actual name", value: (r) => r.actualName },
  { header: "Display name", value: (r) => r.displayName },
  { header: "Username", value: (r) => r.username },
  { header: "Account type", value: (r) => r.accountType.type },
  { header: "Verified", value: (r) => yesNo(r.accountType.isVerified) },
  { header: "Contact number", value: (r) => r.contact.number },
  { header: "Contact country", value: (r) => r.contact.country },
  { header: "Wants captain", value: (r) => yesNo(r.wantsCaptain) },
  { header: "Status", value: (r) => r.status },
  { header: "Organizer response", value: (r) => r.response },
  { header: "Submitted at", value: (r) => r.createdAt },
  { header: "Updated at", value: (r) => r.updatedAt },
];

// GET /api/tournaments/:id/export/registrations.csv   (organizer only)
export const exportRegistrations = asyncHandler(async (req, res) => {
  const t = req.tournament!;
  const docs = await PlayerRegistration.find({ tournamentId: t._id }).sort({ createdAt: 1, _id: 1 }).lean<RegistrationDoc[]>();

  const userIds = [...new Set(docs.map((d) => String(d.userId)))];
  const users = userIds.length ? await User.find({ _id: { $in: userIds } }).select("username").lean<{ _id: Types.ObjectId; username: string }[]>() : [];
  const nameById = new Map(users.map((u) => [String(u._id), u.username]));

  const rows: RegistrationRow[] = docs.map((d) => ({ ...d, username: nameById.get(String(d.userId)) ?? "" }));
  sendCsv(res, t.slug, "registrations", toCsv(REGISTRATION_COLUMNS, rows));
});

interface PlayerRow {
  player: PlayerDoc;
  accountType: string;
  isVerified: boolean;
  teamName: string;
}

const PLAYER_COLUMNS: CsvColumn<PlayerRow>[] = [
  { header: "Display name", value: (r) => r.player.displayName },
  { header: "Account type", value: (r) => r.accountType },
  { header: "Verified", value: (r) => yesNo(r.isVerified) },
  { header: "Status", value: (r) => r.player.status },
  { header: "Team", value: (r) => r.teamName },
  { header: "Sold price", value: (r) => r.player.soldPrice },
  { header: "Added at", value: (r) => r.player.createdAt },
];

// GET /api/tournaments/:id/export/players.csv   (organizer only)
export const exportPlayers = asyncHandler(async (req, res) => {
  const t = req.tournament!;
  const players = await Player.find({ tournamentId: t._id }).sort({ createdAt: 1, _id: 1 }).lean<PlayerDoc[]>();

  const teamIds = players.map((p) => p.teamId).filter((id): id is Types.ObjectId => id !== null);
  const [registrations, teams] = await Promise.all([
    players.length
      ? PlayerRegistration.find({ _id: { $in: players.map((p) => p.registrationId) } }).select("accountType").lean<Pick<RegistrationDoc, "_id" | "accountType">[]>()
      : [],
    teamIds.length ? Team.find({ _id: { $in: teamIds } }).select("name").lean<{ _id: Types.ObjectId; name: string }[]>() : [],
  ]);
  const regById = new Map(registrations.map((r) => [String(r._id), r]));
  const teamById = new Map(teams.map((tm) => [String(tm._id), tm.name]));

  const rows: PlayerRow[] = players.map((player) => {
    const reg = regById.get(String(player.registrationId));
    return {
      player,
      accountType: reg?.accountType.type ?? "",
      isVerified: reg?.accountType.isVerified ?? false,
      teamName: player.teamId ? (teamById.get(String(player.teamId)) ?? "") : "",
    };
  });
  sendCsv(res, t.slug, "players", toCsv(PLAYER_COLUMNS, rows));
});
