import { Tournament } from "../models/index.js";
import type { TournamentDoc } from "../middleware/tournamentAccess.js";
import { getValidated } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { PublicListQuery } from "../validators/tournament.validators.js";

// Rule for this phase: ONLY public + non-draft tournaments are visible to anyone.
// Private tournaments are not reachable by URL either (no link-holder access).
const PUBLIC_FILTER = { visibility: "public", status: { $ne: "draft" } } as const;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function timeline(t: TournamentDoc) {
  const tl = t.tournament_timeline ?? {};
  return {
    registrationStart: tl.registrationStart ?? null,
    registrationClose: tl.registrationClose ?? null,
    auctionStart: tl.auctionStart ?? null,
    tournamentStart: tl.tournamentStart ?? null,
  };
}

// Explicit allow-list: no _id, organizer_id, request_id, phone number or visibility.
function toPublicListItem(t: TournamentDoc) {
  return {
    slug: t.slug,
    name: t.name,
    description: t.description ?? "",
    status: t.status,
    tournament_timeline: timeline(t),
  };
}

function toPublicDetail(t: TournamentDoc) {
  return {
    ...toPublicListItem(t),
    // The id is not a secret. The registration page needs it for /api/tournaments/:id/registrations.
    id: String(t._id),
    contactName: t.contact?.name ?? null, // the phone number is never public
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
    createdAt: t.createdAt,
  };
}

// GET /api/public/tournaments?search=&status=&page=&limit=
export const listPublicTournaments = asyncHandler(async (_req, res) => {
  const { search, status, page, limit } = getValidated<PublicListQuery>(res, "query");

  const filter: Record<string, unknown> = { ...PUBLIC_FILTER };
  if (status) filter.status = status; // validated: never "draft"
  if (search) filter.name = { $regex: escapeRegex(search), $options: "i" }; // escaped: no regex injection

  const [items, total] = await Promise.all([
    Tournament.find(filter)
      .select("slug name description status tournament_timeline")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<TournamentDoc[]>(),
    Tournament.countDocuments(filter),
  ]);

  res.status(200).json({ tournaments: items.map(toPublicListItem), page, limit, total, hasMore: page * limit < total });
});

// GET /api/public/tournaments/:slug
export const getPublicTournament = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug ?? "").toLowerCase();
  if (!SLUG.test(slug) || slug.length > 100) throw new ApiError(404, "Tournament not found");

  const tournament = await Tournament.findOne({ ...PUBLIC_FILTER, slug }).lean<TournamentDoc>();
  // Drafts, private tournaments and unknown slugs are indistinguishable on purpose.
  if (!tournament) throw new ApiError(404, "Tournament not found");

  res.status(200).json({ tournament: toPublicDetail(tournament) });
});
