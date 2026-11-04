import { Router } from "express";
import * as ownerRequests from "../controllers/ownerRequest.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { objectIdParamSchema } from "../validators/common.validators.js";
import { decisionBodySchema, ownerRequestsQuerySchema } from "../validators/tournamentRequest.validators.js";

const router = Router();

// Everything under /api/owner is for the single owner account only.
router.use(requireAuth, requireRole("owner"));

// Temporary test route (Step 7). Remove or replace once real owner routes exist.
router.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong", role: req.user!.role });
});

// Step 14: review tournament requests.
router.get("/tournament-requests", validate({ query: ownerRequestsQuerySchema }), ownerRequests.listRequests);
router.patch(
  "/tournament-requests/:id/decision",
  validate({ params: objectIdParamSchema, body: decisionBodySchema }),
  ownerRequests.decideRequest
);

export default router;
