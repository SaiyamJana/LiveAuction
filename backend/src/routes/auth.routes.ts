import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import {
  resetPasswordEmailLimiter, resetPasswordIpLimiter, sensitiveActionLimiter,
} from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import {
  changePasswordSchema, deleteAccountSchema, loginSchema, registerSchema, resetPasswordSchema,
} from "../validators/auth.validators.js";

const router = Router();

router.post("/register", validate({ body: registerSchema }), auth.register);
router.post("/login", validate({ body: loginSchema }), auth.login);
router.post("/logout", auth.logout);
router.get("/me", requireAuth, auth.me);

// Limiters run BEFORE validate so rejected/failed attempts are counted.
router.post(
  "/reset-password",
  resetPasswordIpLimiter,
  resetPasswordEmailLimiter,
  validate({ body: resetPasswordSchema }),
  auth.resetPassword
);

router.post(
  "/change-password",
  requireAuth,
  sensitiveActionLimiter,
  validate({ body: changePasswordSchema }),
  auth.changePassword
);
router.delete(
  "/account",
  requireAuth,
  sensitiveActionLimiter,
  validate({ body: deleteAccountSchema }),
  auth.deleteAccount
);

export default router;