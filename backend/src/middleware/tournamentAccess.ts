import type { NextFunction, Request, Response } from "express";
import type { Types } from "mongoose";
import { Team, Tournament } from "../models/index.js";
import type { ITournament } from "../models/Tournament.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// A loaded tournament (plain object, not a Mongoose document).
export type TournamentDoc = ITournament & { _id: Types.ObjectId };
export type TournamentRole = "organizer" | "captain";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tournament?: TournamentDoc;
      // Set by requireOrganizer / requireCaptainOrOrganizer after a successful check.
      tournamentRole?: TournamentRole;
    }
  }
}

const OBJECT_ID = /^[a-fA-F0-9]{24}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface LoadOptions {
  // Look the tournament up by Mongo id or by slug.
  by?: "id" | "slug";
  // Name of the route param. Defaults to "id" or "slug" depending on `by`.
  param?: string;
}

// Loads the tournament named in the URL into req.tournament.
// A malformed id/slug is reported as 404 (never 500), and an already loaded
// tournament is reused so chained middleware never queries twice.
//   router.get("/:id", loadTournament(), requireOrganizer, handler)
//   router.get("/:slug", loadTournament({ by: "slug" }), handler)
export function loadTournament(options: LoadOptions = {}) {
  const by = options.by ?? "id";
  const param = options.param ?? by;

  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const raw = req.params[param];
    if (typeof raw !== "string") throw new ApiError(404, "Tournament not found");

    const key = by === "slug" ? raw.toLowerCase() : raw;
    const valid = by === "slug" ? SLUG.test(key) && key.length <= 100 : OBJECT_ID.test(key);
    if (!valid) throw new ApiError(404, "Tournament not found");

    const loaded = req.tournament;
    if (loaded && (by === "slug" ? loaded.slug === key : String(loaded._id) === key)) {
      next();
      return;
    }

    const tournament = await Tournament.findOne(by === "slug" ? { slug: key } : { _id: key }).lean<TournamentDoc>();
    if (!tournament) throw new ApiError(404, "Tournament not found");

    req.tournament = tournament;
    next();
  });
}

function getContext(req: Request): { userId: string; tournament: TournamentDoc } {
  if (!req.user) throw new ApiError(401, "Authentication required");
  if (!req.tournament) {
    // Programming error: loadTournament() must run first.
    throw new Error("loadTournament() must run before the tournament access middleware");
  }
  return { userId: req.user.id, tournament: req.tournament };
}

function isOrganizer(userId: string, tournament: TournamentDoc): boolean {
  return String(tournament.organizer_id) === userId;
}

// Only the real organizer of THIS tournament. The global "owner" role is deliberately
// NOT accepted: it never grants organizer actions.
export const requireOrganizer = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const { userId, tournament } = getContext(req);
    if (!isOrganizer(userId, tournament)) {
      throw new ApiError(403, "Only the organizer of this tournament can do this");
    }
    req.tournamentRole = "organizer";
    next();
  } catch (err) {
    next(err);
  }
};

// The organizer, or the captain of a team that belongs to THIS tournament
// (Team.captainUserId). Global roles never pass this check by themselves.
export const requireCaptainOrOrganizer = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const { userId, tournament } = getContext(req);

  if (isOrganizer(userId, tournament)) {
    req.tournamentRole = "organizer";
    next();
    return;
  }

  // Indexed: { captainUserId: 1 } and { tournamentId, ... }.
  const isCaptain = await Team.exists({ tournamentId: tournament._id, captainUserId: userId });
  if (!isCaptain) {
    throw new ApiError(403, "Only the organizer or a team captain of this tournament can do this");
  }
  req.tournamentRole = "captain";
  next();
});
