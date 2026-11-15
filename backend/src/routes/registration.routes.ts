import { Router } from "express";
import * as registrations from "../controllers/registration.controller.js";
import { requireRole } from "../middleware/auth.js";
import { loadTournament, requireOrganizer } from "../middleware/tournamentAccess.js";
import { validate } from "../middleware/validate.js";
import { objectIdParamSchema } from "../validators/common.validators.js";
import {
  decisionBodySchema,
  registrationBodySchema,
  registrationListQuerySchema,
  registrationParamsSchema,
} from "../validators/registration.validators.js";

// Mounted at /api/tournaments/:id/registrations (requireAuth already ran in tournament.routes.ts).
const router = Router({ mergeParams: true });

const tournamentLoaded = [validate({ params: objectIdParamSchema }), loadTournament()];
const organizerOnly = [...tournamentLoaded, requireOrganizer];

// ---- Player (normal users; the global owner never registers as a player) ----
// "/mine" is declared before any "/:regId" route so it is never read as an id.
router.get("/mine", requireRole("user"), ...tournamentLoaded, registrations.getMine);
router.put("/mine", requireRole("user"), ...tournamentLoaded, validate({ body: registrationBodySchema }), registrations.resubmit);
router.post("/", requireRole("user"), ...tournamentLoaded, validate({ body: registrationBodySchema }), registrations.create);

// ---- Organizer of THIS tournament ----
router.get("/", ...organizerOnly, validate({ query: registrationListQuerySchema }), registrations.list);
// Authorization first (404 / 403), then input validation.
router.patch(
  "/:regId/decision",
  loadTournament(),
  requireOrganizer,
  validate({ params: registrationParamsSchema, body: decisionBodySchema }),
  registrations.decide
);

export default router;
