import { Router } from "express";
import * as players from "../controllers/player.controller.js";
import { validate } from "../middleware/validate.js";
import { playerListQuerySchema, playerParamsSchema } from "../validators/registration.validators.js";

// Mounted at /api/tournaments/:id/players AFTER validate + loadTournament + requireOrganizer
// (see tournament.routes.ts), so every route here is organizer-only for THIS tournament.
const router = Router({ mergeParams: true });

router.get("/", validate({ query: playerListQuerySchema }), players.list);
router.patch("/:playerId/withdraw", validate({ params: playerParamsSchema }), players.withdraw);

export default router;
