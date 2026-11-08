import mongoose from "mongoose";
import { Auction, PlayerRegistration, Team, Tournament } from "../models/index.js";
import type { TournamentDoc } from "../middleware/tournamentAccess.js";
import type { TournamentStatus } from "../types/enums.js";
import { ApiError } from "../utils/ApiError.js";
import { createNotification } from "./notification.service.js";

// ---- The ONLY place that defines which status changes are legal ------------------------------
// draft -> registration_open -> registration_closed -> auction -> tournament_in_progress -> completed
// "cancelled" is reachable from every state except completed. completed/cancelled are final.
export const TRANSITIONS: Readonly<Record<TournamentStatus, readonly TournamentStatus[]>> = {
  draft: ["registration_open", "cancelled"],
  registration_open: ["registration_closed", "cancelled"],
  registration_closed: ["auction", "cancelled"],
  auction: ["tournament_in_progress", "cancelled"],
  tournament_in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: TournamentStatus, to: TournamentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

// Reasons why `target` cannot be entered yet. Empty array = allowed.
// Add per-status rules here as later phases need them.
export function getBlockers(t: TournamentDoc, target: TournamentStatus): string[] {
  const blockers: string[] = [];

  if (target === "registration_open") {
    if (!t.contact?.name?.trim() || !t.contact?.phone?.trim()) {
      blockers.push("Add a contact name and phone number in Settings → Contact.");
    }
    const cfg = t.teamConfig;
    if (!cfg?.totalTeams || !cfg?.minPlayers || !cfg?.maxPlayers) {
      blockers.push("Set total teams, minimum players and maximum players in Settings → Teams.");
    }
    const tl = t.tournament_timeline;
    if (!tl?.registrationStart || !tl?.registrationClose) {
      blockers.push("Set the registration start and close dates in Settings → Timeline.");
    }
  }

  return blockers;
}

export interface NextAction {
  to: TournamentStatus;
  allowed: boolean;
  blockers: string[];
}

// Every status the tournament could move to right now, with the reasons it is blocked (if any).
export function getNextActions(t: TournamentDoc): NextAction[] {
  return TRANSITIONS[t.status].map((to) => {
    const blockers = getBlockers(t, to);
    return { to, allowed: blockers.length === 0, blockers };
  });
}

const LOCKING_TOURNAMENT_STATUSES: readonly TournamentStatus[] = ["auction", "tournament_in_progress", "completed"];

// teamConfig and pointsConfig are frozen once the auction has started.
export async function areSettingsLocked(t: TournamentDoc): Promise<boolean> {
  if (LOCKING_TOURNAMENT_STATUSES.includes(t.status)) return true;
  const started = await Auction.exists({ tournamentId: t._id, status: { $in: ["live", "paused", "completed"] } });
  return started !== null;
}

// Everyone who should hear about a cancellation: players with a live registration
// (pending/accepted) and team captains. The organizer already knows, so is skipped.
async function findAffectedUserIds(t: TournamentDoc, session: mongoose.ClientSession): Promise<string[]> {
  const players = await PlayerRegistration.distinct("userId", {
    tournamentId: t._id,
    status: { $in: ["pending", "accepted"] },
  }).session(session);
  const captains = await Team.distinct("captainUserId", {
    tournamentId: t._id,
    captainUserId: { $ne: null },
  }).session(session);

  const ids = new Set<string>([...players, ...captains].map((id) => String(id)));
  ids.delete(String(t.organizer_id));
  return [...ids];
}

// Validates and applies a status change. Throws ApiError with a meaningful message when blocked.
export async function changeTournamentStatus(
  t: TournamentDoc,
  target: TournamentStatus,
  reason?: string
): Promise<TournamentDoc> {
  if (t.status === target) {
    throw new ApiError(409, `The tournament is already ${target.replace(/_/g, " ")}`);
  }
  if (!canTransition(t.status, target)) {
    const from = t.status.replace(/_/g, " ");
    const message =
      t.status === "completed" || t.status === "cancelled"
        ? `A ${from} tournament cannot be changed any more`
        : `Cannot move a tournament from "${from}" to "${target.replace(/_/g, " ")}"`;
    throw new ApiError(400, message);
  }

  const blockers = getBlockers(t, target);
  if (blockers.length > 0) {
    throw new ApiError(
      422,
      "This status change is blocked until the missing information is added",
      blockers.map((message) => ({ field: "status", message }))
    );
  }

  const session = await mongoose.startSession();
  try {
    const holder: { value?: TournamentDoc } = {};
    await session.withTransaction(async () => {
      holder.value = undefined; // the callback can be re-run on transient errors

      // Atomic "from -> to": if two requests race, only one matches the old status.
      const updated = await Tournament.findOneAndUpdate(
        { _id: t._id, status: t.status },
        { $set: { status: target } },
        { new: true, session }
      ).lean<TournamentDoc>();
      if (!updated) {
        throw new ApiError(409, "The tournament status was changed by someone else. Refresh and try again.");
      }

      if (target === "cancelled") {
        const body = `The tournament "${t.name}" has been cancelled by the organizer.${reason ? ` Reason: ${reason}` : ""}`;
        // Reuses the Phase 3 helper; sequential because one transaction session is not concurrency-safe.
        for (const userId of await findAffectedUserIds(t, session)) {
          await createNotification(userId, "tournament_cancelled", body, session);
        }
      }
      holder.value = updated;
    });

    if (!holder.value) throw new Error("Status change did not complete");
    return holder.value;
  } finally {
    await session.endSession();
  }
}
