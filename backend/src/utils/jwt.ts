import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { UserRole } from "../types/enums.js";

export const AUTH_COOKIE_NAME = "auth_token";//variable name for the cookie that will store the JWT token

// What we put inside the token. The server ALWAYS re-checks role and
// tokenVersion against the database, so this is never trusted on its own.
export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  tokenVersion: number;
}

const SAME_SITE_VALUES = ["lax", "strict", "none"] as const;
type SameSite = (typeof SAME_SITE_VALUES)[number];

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set in the environment");
  }
  return secret;
}

// Called once from server.ts so a misconfigured server fails at startup
// instead of on the first login attempt.
export function assertAuthConfig(): void {
  const secret = getSecret();
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
  if (!process.env.JWT_EXPIRES_IN) {
    throw new Error("JWT_EXPIRES_IN is not set in the environment (for example 7d)");
  }
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, getSecret(), options);
}

// Returns the payload, or null for any invalid / expired / tampered token.
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret(), { algorithms: ["HS256"] });
    if (typeof decoded === "string") return null;
    const { userId, role, tokenVersion } = decoded as Partial<AuthTokenPayload>;
    if (
      typeof userId !== "string" ||
      (role !== "owner" && role !== "user") ||
      typeof tokenVersion !== "number"
    ) {
      return null;
    }
    return { userId, role, tokenVersion };
  } catch {
    return null;
  }
}

function getSameSite(): SameSite {
  const value = (process.env.COOKIE_SAMESITE ?? "lax").toLowerCase();
  return (SAME_SITE_VALUES as readonly string[]).includes(value) ? (value as SameSite) : "lax";
}

// Same options must be used to set AND clear the cookie, otherwise browsers
// keep the old cookie.
function baseCookieOptions(): CookieOptions {
  const sameSite = getSameSite();
  return {
    httpOnly: true,
    sameSite,
    // Browsers reject SameSite=None cookies that are not Secure.
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    path: "/",
  };
}

export function setAuthCookie(res: Response, token: string): void {
  // Cookie lifetime follows the token's own expiry so they never disagree.
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const maxAge = decoded?.exp ? decoded.exp * 1000 - Date.now() : undefined;
  res.cookie(AUTH_COOKIE_NAME, token, { ...baseCookieOptions(), maxAge });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions());
}