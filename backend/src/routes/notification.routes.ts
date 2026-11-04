import { Router } from "express";
import * as notifications from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { objectIdParamSchema } from "../validators/common.validators.js";
import { listNotificationsQuerySchema } from "../validators/notification.validators.js";

const router = Router();

// Every logged-in user (including the owner) may read their OWN notifications.
router.use(requireAuth);

router.get("/", validate({ query: listNotificationsQuerySchema }), notifications.listNotifications);
router.patch("/read-all", notifications.markAllNotificationsRead);
router.patch("/:id/read", validate({ params: objectIdParamSchema }), notifications.markNotificationRead);

export default router;
