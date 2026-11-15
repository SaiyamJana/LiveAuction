import { getValidated } from "../middleware/validate.js";
import {
  createRegistration,
  decideRegistration,
  findMyRegistration,
  getRegistrationWindow,
  listRegistrations,
  resubmitRegistration,
  toRegistrationDto,
} from "../services/registration.service.js";
import { toPlayerSummaryDto } from "../services/player.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type {
  DecisionBody,
  RegistrationBody,
  RegistrationListQuery,
  RegistrationParams,
} from "../validators/registration.validators.js";

// userId ALWAYS comes from the session (req.user), never from the body or the URL.

// POST /api/tournaments/:id/registrations
export const create = asyncHandler(async (req, res) => {
  const body = getValidated<RegistrationBody>(res, "body");
  const registration = await createRegistration(req.tournament!, req.user!.id, body);
  res.status(201).json({
    message: "Registration submitted. The organizer will review it soon.",
    registration: toRegistrationDto(registration),
  });
});

// GET /api/tournaments/:id/registrations/mine
// 200 with registration: null when the user has not registered (not an error).
export const getMine = asyncHandler(async (req, res) => {
  const t = req.tournament!;
  const registration = await findMyRegistration(t._id, req.user!.id);
  const window = getRegistrationWindow(t);
  res.status(200).json({
    registration: registration ? toRegistrationDto(registration) : null,
    registrationOpen: window.open,
    closedReason: window.reason,
    isOrganizer: String(t.organizer_id) === req.user!.id,
  });
});

// PUT /api/tournaments/:id/registrations/mine
export const resubmit = asyncHandler(async (req, res) => {
  const body = getValidated<RegistrationBody>(res, "body");
  const registration = await resubmitRegistration(req.tournament!, req.user!.id, body);
  res.status(200).json({
    message: "Registration resubmitted. It is back in the organizer's review queue.",
    registration: toRegistrationDto(registration),
  });
});

// GET /api/tournaments/:id/registrations?status=&search=&page=&limit=   (organizer only)
export const list = asyncHandler(async (req, res) => {
  const query = getValidated<RegistrationListQuery>(res, "query");
  const result = await listRegistrations(req.tournament!._id, query);
  res.status(200).json({ registrations: result.items, counts: result.counts, page: query.page, limit: query.limit, total: result.total, hasMore: result.hasMore });
});

// PATCH /api/tournaments/:id/registrations/:regId/decision   (organizer only)
export const decide = asyncHandler(async (req, res) => {
  const { regId } = getValidated<RegistrationParams>(res, "params");
  const body = getValidated<DecisionBody>(res, "body");
  const { registration, player } = await decideRegistration(req.tournament!, regId, body);
  res.status(200).json({
    message: body.decision === "accept" ? "Registration accepted. The player was added to the tournament." : "Registration rejected. The player was notified.",
    registration,
    player: player ? toPlayerSummaryDto(player) : null,
  });
});
