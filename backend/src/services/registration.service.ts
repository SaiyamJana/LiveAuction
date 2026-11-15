import mongoose from "mongoose";
import type { Types, UpdateQuery } from "mongoose";
import { PlayerRegistration, User } from "../models/index.js";
import type { IPlayerRegistration } from "../models/PlayerRegistration.js";
import type { TournamentDoc } from "../middleware/tournamentAccess.js";
import type { AccountType, RegistrationStatus } from "../types/enums.js";
import { ApiError } from "../utils/ApiError.js";
import { isDuplicateKeyError } from "../utils/dbErrors.js";
import type { DecisionBody, RegistrationBody, RegistrationListQuery } from "../validators/registration.validators.js";
import { createNotification } from "./notification.service.js";
import { createPlayerFromRegistration } from "./player.service.js";
import type { PlayerDoc } from "./player.service.js";

export type RegistrationDoc = IPlayerRegistration & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

// What the player sees about their own registration.
export interface RegistrationDto {
  id: string;
  tournamentId: string;
  actualName: string;
  displayName: string;
  accountType: AccountType;
  isVerified: boolean;
  contactNumber: string;
  contactCountry: string;
  wantsCaptain: boolean;
  status: RegistrationStatus;
  response: string | null;
  submittedAt: Date;
  updatedAt: Date;
}

// The organizer's view adds who submitted it.
export interface OrganizerRegistrationDto extends RegistrationDto {
  username: string | null; // null when the user deleted their account
}

export function toRegistrationDto(r: RegistrationDoc): RegistrationDto {
  return {
    id: String(r._id),
    tournamentId: String(r.tournamentId),
    actualName: r.actualName,
    displayName: r.displayName,
    accountType: r.accountType.type,
    isVerified: r.accountType.isVerified,
    contactNumber: r.contact.number,
    contactCountry: r.contact.country,
    wantsCaptain: r.wantsCaptain,
    status: r.status,
    response: r.response ?? null,
    submittedAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const formatUtc = (d: Date): string => `${d.toLocaleString("en-GB", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC`;

// ---- Registration window -----------------------------------------------------------------
// Open = status is registration_open AND now is inside the configured registration dates.
export function getRegistrationWindow(t: TournamentDoc, now: Date = new Date()): { open: boolean; reason: string | null } {
  if (t.status !== "registration_open") {
    const reason =
      t.status === "draft"
        ? "Registration has not opened yet."
        : t.status === "cancelled"
          ? "This tournament was cancelled."
          : "Registration is closed for this tournament.";
    return { open: false, reason };
  }
  const { registrationStart, registrationClose } = t.tournament_timeline ?? {};
  if (registrationStart && now < registrationStart) {
    return { open: false, reason: `Registration opens on ${formatUtc(registrationStart)}.` };
  }
  if (registrationClose && now > registrationClose) {
    return { open: false, reason: `Registration closed on ${formatUtc(registrationClose)}.` };
  }
  return { open: true, reason: null };
}

function assertRegistrationOpen(t: TournamentDoc): void {
  const window = getRegistrationWindow(t);
  if (!window.open) throw new ApiError(409, window.reason ?? "Registration is closed for this tournament.");
}

// ---- Player: register / read / resubmit --------------------------------------------------
export async function createRegistration(t: TournamentDoc, userId: string, input: RegistrationBody): Promise<RegistrationDoc> {
  if (String(t.organizer_id) === userId) {
    throw new ApiError(403, "Organizers cannot register as players in their own tournament");
  }
  // Private tournaments are not reachable by the public, so nobody can join one yet.
  if (t.visibility === "private") throw new ApiError(404, "Tournament not found");
  assertRegistrationOpen(t);

  try {
    const created = await PlayerRegistration.create({
      tournamentId: t._id,
      userId, // from the session, never from the request body
      actualName: input.actualName,
      displayName: input.displayName,
      accountType: { type: input.accountType, isVerified: false }, // only an organizer can verify
      contact: { number: input.contactNumber, country: input.contactCountry },
      wantsCaptain: input.wantsCaptain,
      status: "pending",
    });
    // `timestamps: true` adds createdAt/updatedAt at runtime; the schema interface does not declare them.
    return created.toObject() as unknown as RegistrationDoc;
  } catch (err) {
    // The unique (tournamentId, userId) index is the final authority, so double-clicks and
    // two tabs cannot create two registrations.
    if (isDuplicateKeyError(err)) throw new ApiError(409, "You have already registered for this tournament");
    throw err;
  }
}

export async function findMyRegistration(tournamentId: Types.ObjectId, userId: string): Promise<RegistrationDoc | null> {
  return PlayerRegistration.findOne({ tournamentId, userId }).lean<RegistrationDoc>();
}

// Rejected -> pending, same record, organizer response cleared.
export async function resubmitRegistration(t: TournamentDoc, userId: string, input: RegistrationBody): Promise<RegistrationDoc> {
  const existing = await findMyRegistration(t._id, userId);
  if (!existing) throw new ApiError(404, "You have not registered for this tournament");

  if (existing.status === "pending") throw new ApiError(409, "Your registration is still waiting for review and cannot be edited");
  if (existing.status === "accepted") throw new ApiError(409, "Your registration was accepted and can no longer be edited");
  assertRegistrationOpen(t);

  // Atomic "rejected -> pending": a second concurrent resubmit matches nothing.
  const updated = await PlayerRegistration.findOneAndUpdate(
    { _id: existing._id, userId, tournamentId: t._id, status: "rejected" },
    {
      $set: {
        actualName: input.actualName,
        displayName: input.displayName,
        "accountType.type": input.accountType,
        "accountType.isVerified": false, // changed details must be verified again
        "contact.number": input.contactNumber,
        "contact.country": input.contactCountry,
        wantsCaptain: input.wantsCaptain,
        status: "pending",
      },
      $unset: { response: "" },
    },
    { new: true, runValidators: true }
  ).lean<RegistrationDoc>();

  if (!updated) throw new ApiError(409, "Your registration was changed in the meantime. Refresh and try again.");
  return updated;
}

// ---- Organizer: list ---------------------------------------------------------------------
async function attachUsernames(docs: RegistrationDoc[]): Promise<OrganizerRegistrationDto[]> {
  const ids = [...new Set(docs.map((d) => String(d.userId)))];
  const users = ids.length ? await User.find({ _id: { $in: ids } }).select("username").lean<{ _id: Types.ObjectId; username: string }[]>() : [];
  const nameById = new Map(users.map((u) => [String(u._id), u.username]));
  return docs.map((d) => ({ ...toRegistrationDto(d), username: nameById.get(String(d.userId)) ?? null }));
}

export async function listRegistrations(tournamentId: Types.ObjectId, query: RegistrationListQuery) {
  const { status, search, page, limit } = query;

  const filter: Record<string, unknown> = { tournamentId };
  if (status) filter.status = status;
  if (search) {
    const re = { $regex: escapeRegex(search), $options: "i" }; // escaped: no regex injection
    filter.$or = [{ actualName: re }, { displayName: re }];
  }

  const [docs, total, grouped] = await Promise.all([
    PlayerRegistration.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<RegistrationDoc[]>(),
    PlayerRegistration.countDocuments(filter),
    PlayerRegistration.aggregate<{ _id: RegistrationStatus; count: number }>([
      { $match: { tournamentId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  const counts: Record<RegistrationStatus | "total", number> = { pending: 0, accepted: 0, rejected: 0, total: 0 };
  for (const row of grouped) {
    counts[row._id] = row.count;
    counts.total += row.count;
  }

  return { items: await attachUsernames(docs), total, counts, hasMore: page * limit < total };
}

// ---- Organizer: decision -----------------------------------------------------------------
export interface DecisionResult {
  registration: OrganizerRegistrationDto;
  player: PlayerDoc | null;
}

const DECIDABLE_TOURNAMENT_STATUSES: readonly string[] = ["registration_open", "registration_closed"];

// pending -> accepted (+ Player) or pending -> rejected. Everything - the status change, the
// Player and the notification - happens in ONE transaction: all of it, or none of it.
export async function decideRegistration(
  t: TournamentDoc,
  registrationId: string,
  input: DecisionBody
): Promise<DecisionResult> {
  if (!DECIDABLE_TOURNAMENT_STATUSES.includes(t.status)) {
    throw new ApiError(409, "Registrations can only be reviewed while registration is open or closed, before the auction starts");
  }
  const accept = input.decision === "accept";

  const session = await mongoose.startSession();
  try {
    const holder: { value?: { registration: RegistrationDoc; player: PlayerDoc | null } } = {};

    await session.withTransaction(async () => {
      holder.value = undefined; // the callback can be re-run on transient errors

      const $set: Record<string, unknown> = { status: accept ? "accepted" : "rejected" };
      const update: Record<string, unknown> = { $set };
      // isVerified is applied on acceptance only. On rejection it is ignored.
      if (accept && input.isVerified !== undefined) $set["accountType.isVerified"] = input.isVerified;
      if (input.response) $set.response = input.response;
      else update.$unset = { response: "" };

      // Atomic "pending -> decided". The filter also pins the tournament, so an organizer can
      // never decide another tournament's registration by guessing its id. Of two concurrent
      // decisions only one matches; accepted/rejected registrations never match again.
      const updated = await PlayerRegistration.findOneAndUpdate(
        { _id: registrationId, tournamentId: t._id, status: "pending" },
        update as UpdateQuery<IPlayerRegistration>,
        { new: true, session }
      ).lean<RegistrationDoc>();

      if (!updated) {
        const existing = await PlayerRegistration.findOne({ _id: registrationId, tournamentId: t._id })
          .select("status")
          .session(session)
          .lean<{ status: RegistrationStatus }>();
        if (!existing) throw new ApiError(404, "Registration not found in this tournament");
        throw new ApiError(
          409,
          existing.status === "accepted"
            ? "This registration was already accepted and cannot be changed"
            : "This registration was already rejected. The player must resubmit it before it can be reviewed again"
        );
      }

      const player = accept ? await createPlayerFromRegistration(updated, session) : null;

      const note = input.response ? ` Organizer's message: ${input.response}` : "";
      await createNotification(
        updated.userId,
        "registration_response",
        accept
          ? `Your registration for "${t.name}" was accepted. You are now in the player pool.${note}`
          : `Your registration for "${t.name}" was rejected. You can edit and resubmit it while registration is open.${note}`,
        session
      );

      holder.value = { registration: updated, player };
    });

    const outcome = holder.value;
    if (!outcome) throw new Error("Decision did not complete");
    const [dto] = await attachUsernames([outcome.registration]);
    return { registration: dto, player: outcome.player };
  } catch (err) {
    // A Player for this registration/user already exists (unique index): nothing was saved.
    if (isDuplicateKeyError(err)) {
      throw new ApiError(409, "A player already exists for this registration. Refresh and try again.");
    }
    throw err;
  } finally {
    await session.endSession();
  }
}
