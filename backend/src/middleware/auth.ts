import type { NextFunction, Request, Response } from "express";
import { User } from "../models/index.js";
import type { UserRole } from "../types/enums.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AUTH_COOKIE_NAME, clearAuthCookie, verifyAuthToken } from "../utils/jwt.js";

// Adds `req.user` to Express's Request type.
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Reads the JWT cookie, verifies it, loads the user and compares tokenVersion.
// Role always comes from the database, never from the token.
export const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE_NAME];
  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    clearAuthCookie(res);
    throw new ApiError(401, "Your session is invalid or has expired. Please log in again.");
  }

  const user = await User.findById(payload.userId).select("username email role tokenVersion");
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    clearAuthCookie(res);
    throw new ApiError(401, "Your session is invalid or has expired. Please log in again.");
  }

  req.user = { id: user.id as string, username: user.username, email: user.email, role: user.role };
  next();
});

// Use AFTER requireAuth:  router.use(requireAuth, requireRole("owner"))
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError(401, "Authentication required"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, "You do not have permission to perform this action"));
      return;
    }
    next();
  };
}