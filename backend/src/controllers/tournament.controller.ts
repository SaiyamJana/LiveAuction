import { Tournament } from "../models/index.js";
import type { TournamentDoc } from "../middleware/tournamentAccess.js";
import { getValidated } from "../middleware/validate.js";
import { areSettingsLocked, changeTournamentStatus, getNextActions } from "../services/tournamentLifecycle.js";
import { ApiError } from "../utils/ApiError.js";
import type { FieldError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { ChangeStatusBody, MyTournamentsQuery, UpdateTournamentBody } from "../validators/tournament.validators.js";

const TIMELINE_KEYS = ["registrationStart", "registrationClose", "auctionStart", "tournamentStart"] as const;

// Never exposes organizer_id / request_id / __v.
export function toTournamentSummaryDto(t: TournamentDoc) {
  return {
    id: String(t._id),
    name: t.name,
    slug: t.slug,
    description: t.description ?? "",
    visibility: t.visibility,
    status: t.status,
    tournament_timeline: toTimelineDto(t),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function toTimelineDto(t: TournamentDoc) {
  const tl = t.tournament_timeline ?? {};
  return {
    registrationStart: tl.registrationStart ?? null,
    registrationClose: tl.registrationClose ?? null,
    auctionStart: tl.auctionStart ?? null,
    tournamentStart: tl.tournamentStart ?? null,
  };
}

// Full organizer view. Optional settings come back as null so the client never guesses.
async function toTournamentDetailDto(t: TournamentDoc) {
  return {
    ...toTournamentSummaryDto(t),
    contact: { name: t.contact?.name ?? null, phone: t.contact?.phone ?? null },
    teamConfig: {
      totalTeams: t.teamConfig?.totalTeams ?? null,
      minPlayers: t.teamConfig?.minPlayers ?? null,
      maxPlayers: t.teamConfig?.maxPlayers ?? null,
    },
    pointsConfig: {
      win: t.pointsConfig?.win ?? null,
      loss: t.pointsConfig?.loss ?? null,
      tie: t.pointsConfig?.tie ?? null,
      noresult: t.pointsConfig?.noresult ?? null,
    },
    locks: { teamAndPoints: await areSettingsLocked(t) },
    nextActions: getNextActions(t),
  };
}

// GET /api/tournaments/mine?page=&limit=
export const listMyTournaments = asyncHandler(async (req, res) => {
  const { page, limit } = getValidated<MyTournamentsQuery>(res, "query");
  // organizer_id always comes from the session, never from the client.
  const filter = { organizer_id: req.user!.id };

  const [items, total] = await Promise.all([
    Tournament.find(filter)
      .select("name slug description visibility status tournament_timeline createdAt updatedAt")
      .sort({ updatedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<TournamentDoc[]>(),
    Tournament.countDocuments(filter),
  ]);

  res.status(200).json({ tournaments: items.map(toTournamentSummaryDto), page, limit, total, hasMore: page * limit < total });
});

// GET /api/tournaments/:id   (organizer only; loadTournament + requireOrganizer run first)
export const getTournament = asyncHandler(async (req, res) => {
  res.status(200).json({ tournament: await toTournamentDetailDto(req.tournament!) });
});

type Dotted = Record<string, unknown>;

// { contact: { name: "A" } } -> { "contact.name": "A" }: only the keys that were sent,
// so a partial update can never overwrite siblings with undefined/defaults.
function flatten(prefix: string, value: Record<string, unknown> | undefined, set: Dotted, unset: Dotted): void {
  if (!value) return;
  for (const [key, v] of Object.entries(value)) {
    if (v === undefined) continue;
    if (v === null) unset[`${prefix}.${key}`] = "";
    else set[`${prefix}.${key}`] = v;
  }
}

// PATCH /api/tournaments/:id   (organizer only)
export const updateTournament = asyncHandler(async (req, res) => {
  const t = req.tournament!;
  const body = getValidated<UpdateTournamentBody>(res, "body");
  const errors: FieldError[] = [];

  // ---- 1. Team and points rules are frozen once the auction has started ----
  if (body.teamConfig || body.pointsConfig) {
    if (await areSettingsLocked(t)) {
      const changed = (section: "teamConfig" | "pointsConfig") =>
        Object.entries(body[section] ?? {}).filter(([key, v]) => v !== undefined && (t[section] as Record<string, unknown> | undefined)?.[key] !== v);
      for (const section of ["teamConfig", "pointsConfig"] as const) {
        for (const [key] of changed(section)) {
          errors.push({ field: `${section}.${key}`, message: "Locked: this setting cannot change after the auction has started" });
        }
      }
      if (errors.length > 0) {
        throw new ApiError(409, "Team and points settings are locked because the auction has started", errors);
      }
    }
  }

  // ---- 2. Cross-field rules are checked against the MERGED result (stored values + this patch) ----
  const minPlayers = body.teamConfig?.minPlayers ?? t.teamConfig?.minPlayers;
  const maxPlayers = body.teamConfig?.maxPlayers ?? t.teamConfig?.maxPlayers;
  if (minPlayers !== undefined && maxPlayers !== undefined && minPlayers > maxPlayers) {
    const field = body.teamConfig?.minPlayers !== undefined ? "teamConfig.minPlayers" : "teamConfig.maxPlayers";
    errors.push({ field, message: "Minimum players cannot be greater than maximum players" });
  }

  const merged: Partial<Record<(typeof TIMELINE_KEYS)[number], Date | undefined>> = {};
  for (const key of TIMELINE_KEYS) {
    const patch = body.tournament_timeline?.[key];
    merged[key] = patch === undefined ? t.tournament_timeline?.[key] : patch ?? undefined; // null clears
  }
  const rules: { before: (typeof TIMELINE_KEYS)[number]; after: (typeof TIMELINE_KEYS)[number]; strict: boolean; message: string }[] = [
    { before: "registrationStart", after: "registrationClose", strict: true, message: "Registration must close after it opens" },
    { before: "registrationClose", after: "auctionStart", strict: false, message: "The auction cannot start before registration closes" },
    { before: "auctionStart", after: "tournamentStart", strict: false, message: "The tournament cannot start before the auction" },
  ];
  // Compare each date with the closest EARLIER date that is set, so one missing date never hides a mistake.
  const sequence = TIMELINE_KEYS.filter((k) => merged[k] !== undefined);
  for (let i = 1; i < sequence.length; i++) {
    const earlier = merged[sequence[i - 1]]!.getTime();
    const later = merged[sequence[i]]!.getTime();
    const rule = rules.find((r) => r.before === sequence[i - 1] && r.after === sequence[i]);
    const bad = rule?.strict ? later <= earlier : later < earlier;
    if (bad) {
      errors.push({
        field: `tournament_timeline.${sequence[i]}`,
        message: rule?.message ?? `This date must not be before ${sequence[i - 1]}`,
      });
    }
  }

  if (errors.length > 0) throw new ApiError(400, "Validation failed", errors);

  // ---- 3. Build a minimal $set / $unset ----
  const $set: Dotted = {};
  const $unset: Dotted = {};
  if (body.name !== undefined) $set.name = body.name;
  if (body.description !== undefined) $set.description = body.description;
  if (body.visibility !== undefined) $set.visibility = body.visibility;
  flatten("contact", body.contact, $set, $unset);
  flatten("teamConfig", body.teamConfig, $set, $unset);
  flatten("pointsConfig", body.pointsConfig, $set, $unset);
  flatten("tournament_timeline", body.tournament_timeline, $set, $unset);
  // NOTE: slug is never part of an update, so it is stable for the life of the tournament
  // (and therefore unchanged once public).

  if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
    throw new ApiError(400, "No changes to save");
  }

  const update: Record<string, Dotted> = {};
  if (Object.keys($set).length > 0) update.$set = $set;
  if (Object.keys($unset).length > 0) update.$unset = $unset;

  const updated = await Tournament.findByIdAndUpdate(t._id, update, { new: true, runValidators: true }).lean<TournamentDoc>();
  if (!updated) throw new ApiError(404, "Tournament not found");

  res.status(200).json({ message: "Settings saved.", tournament: await toTournamentDetailDto(updated) });
});

// PATCH /api/tournaments/:id/status   (organizer only)
export const updateTournamentStatus = asyncHandler(async (req, res) => {
  const { status, reason } = getValidated<ChangeStatusBody>(res, "body");
  const updated = await changeTournamentStatus(req.tournament!, status, reason);
  res.status(200).json({
    message: `Tournament is now ${status.replace(/_/g, " ")}.`,
    tournament: await toTournamentDetailDto(updated),
  });
});

