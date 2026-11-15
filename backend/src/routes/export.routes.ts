import { Router } from "express";
import * as exportsController from "../controllers/export.controller.js";

// Mounted at /api/tournaments/:id/export AFTER validate + loadTournament + requireOrganizer.
const router = Router({ mergeParams: true });

router.get("/registrations.csv", exportsController.exportRegistrations);
router.get("/players.csv", exportsController.exportPlayers);

export default router;
