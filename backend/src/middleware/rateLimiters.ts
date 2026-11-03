import type { Request } from "express";
import { rateLimit } from "express-rate-limit";

const WINDOW_MS = 15 * 60 * 1000;

// NOTE: counters live in this server process's memory. They reset on restart
// and are not shared between several server instances. For a single Node
// process (the current deployment plan) this is fine; use a shared store
// (for example Redis) if you ever scale to more than one instance.

// 1) Per IP address: stops one machine from trying many accounts.
// Only FAILED requests (status >= 400) are counted.
export const resetPasswordIpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

// 2) Per target email: stops guessing one account's secure code from many IPs.
export const resetPasswordEmailLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const email = (req.body as { email?: unknown } | undefined)?.email;
    return typeof email === "string" ? `email:${email.trim().toLowerCase().slice(0, 254)}` : "email:none";
  },
  validate: false,
  message: { message: "Too many attempts for this account. Please try again later." },
});

// For logged-in users confirming with a password / secure code
// (change password, delete account). Keyed by user id, so it must run AFTER requireAuth.
export const sensitiveActionLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request): string => `user:${req.user?.id ?? "anonymous"}`,
  validate: false,
  message: { message: "Too many failed attempts. Please try again later." },
});