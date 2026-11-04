import { Router } from "express";
import * as requests from "../controllers/tournamentRequest.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { objectIdParamSchema } from "../validators/common.validators.js";
import {
  createTournamentRequestSchema, myRequestsQuerySchema,
} from "../validators/tournamentRequest.validators.js";

const router = Router();

// Only normal users request tournaments; the owner reviews them under /api/owner.
router.use(requireAuth, requireRole("user"));

router.post("/", validate({ body: createTournamentRequestSchema }), requests.createTournamentRequest);
router.get("/mine", validate({ query: myRequestsQuerySchema }), requests.listMyRequests);
router.patch("/:id/withdraw", validate({ params: objectIdParamSchema }), requests.withdrawRequest);

export default router;
