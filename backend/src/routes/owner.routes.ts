import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Everything under /api/owner is for the single owner account only.
router.use(requireAuth, requireRole("owner"));

// Temporary test route (Step 7). Remove or replace once real owner routes exist.
router.get("/ping", (req, res) => {
  res.status(200).json({ message: "pong", role: req.user!.role });
});

export default router;