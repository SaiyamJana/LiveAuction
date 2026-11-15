import { Router } from "express";
import * as tournaments from "../controllers/tournament.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { loadTournament, requireOrganizer } from "../middleware/tournamentAccess.js";
import { validate } from "../middleware/validate.js";
import { objectIdParamSchema } from "../validators/common.validators.js";
import exportRoutes from "./export.routes.js";
import playerRoutes from "./player.routes.js";
import registrationRoutes from "./registration.routes.js";
import { changeStatusSchema, myTournamentsQuerySchema, updateTournamentSchema } from "../validators/tournament.validators.js";

const router = Router();

router.use(requireAuth);

// Must stay ABOVE "/:id" or "mine" would be treated as an id.
router.get("/mine", requireRole("user"), validate({ query: myTournamentsQuerySchema }), tournaments.listMyTournaments);

// Every route below: params valid -> tournament loaded once -> caller must be ITS organizer.
const organizerOnly = [validate({ params: objectIdParamSchema }), loadTournament(), requireOrganizer];

// Phase 5. Registrations have mixed access (players + organizer) so that router checks per route;
// players and CSV exports are organizer-only for the whole sub-router.
router.use("/:id/registrations", registrationRoutes);
router.use("/:id/players", ...organizerOnly, playerRoutes);
router.use("/:id/export", ...organizerOnly, exportRoutes);

router.get("/:id", ...organizerOnly, tournaments.getTournament);
router.patch("/:id", ...organizerOnly, validate({ body: updateTournamentSchema }), tournaments.updateTournament);
router.patch("/:id/status", ...organizerOnly, validate({ body: changeStatusSchema }), tournaments.updateTournamentStatus);

export default router;
