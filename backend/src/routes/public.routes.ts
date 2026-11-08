import { Router } from "express";
import * as publicTournaments from "../controllers/public.controller.js";
import { validate } from "../middleware/validate.js";
import { publicListQuerySchema } from "../validators/tournament.validators.js";

const router = Router();

// No requireAuth: anyone may call these. Responses use explicit safe DTOs only.
router.get("/tournaments", validate({ query: publicListQuerySchema }), publicTournaments.listPublicTournaments);
router.get("/tournaments/:slug", publicTournaments.getPublicTournament);

export default router;
