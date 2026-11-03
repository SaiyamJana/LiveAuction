import bcrypt from "bcryptjs";
import type { Response } from "express";
import mongoose from "mongoose";
import type { HydratedDocument } from "mongoose";
import {
  Notification, Player, PlayerRegistration, Team, Tournament, TournamentRequest, User,
} from "../models/index.js";
import type { IUser } from "../models/User.js";
import type { TournamentStatus } from "../types/enums.js";
import { getValidated } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearAuthCookie, setAuthCookie, signAuthToken } from "../utils/jwt.js";
import type {
  ChangePasswordBody, DeleteAccountBody, LoginBody, RegisterBody, ResetPasswordBody,
} from "../validators/auth.validators.js";

const BCRYPT_ROUNDS = 12; // same cost as scripts/createOwner.ts
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const TERMINAL_TOURNAMENT_STATUSES: TournamentStatus[] = ["completed", "cancelled"];

const INVALID_CREDENTIALS = "Incorrect email or password";
const INVALID_RESET = "Invalid email or secure code";

// Compared against when the email does not exist, so "unknown email" and
// "wrong password" take about the same time.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing-only", BCRYPT_ROUNDS);

// The only user shape that ever leaves the server.
function toSafeUser(user: HydratedDocument<IUser>) {
  return {
    id: user.id as string,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function issueSession(res: Response, user: HydratedDocument<IUser>): void {
  setAuthCookie(
    res,
    signAuthToken({ userId: user.id as string, role: user.role, tokenVersion: user.tokenVersion })
  );
}

function lockedError(res: Response, until: Date): ApiError {
  const seconds = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 1000));
  const minutes = Math.ceil(seconds / 60);
  res.set("Retry-After", String(seconds));
  return new ApiError(
    423,
    `Too many failed login attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or reset your password with your secure code.`
  );
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

// ---------------------------------------------------------------- Step 4
export const register = asyncHandler(async (req, res) => {
  const { username, email, password, secureCode } = getValidated<RegisterBody>(res, "body");

  if (await User.exists({ email })) {
    throw new ApiError(409, "An account with this email already exists", [
      { field: "email", message: "An account with this email already exists" },
    ]);
  }

  const [passwordHash, secureCodeHash] = await Promise.all([
    bcrypt.hash(password, BCRYPT_ROUNDS),
    bcrypt.hash(secureCode, BCRYPT_ROUNDS),
  ]);

  let user: HydratedDocument<IUser>;
  try {
    user = await User.create({
      username,
      email,
      passwordHash,
      secureCodeHash,
      role: "user", // always "user": the client can never choose a role
    });
  } catch (err) {
    // Two simultaneous registrations with the same email: the unique index decides.
    if (isDuplicateKeyError(err)) {
      throw new ApiError(409, "An account with this email already exists", [
        { field: "email", message: "An account with this email already exists" },
      ]);
    }
    throw err;
  }

  res.status(201).json({ message: "Account created. You can now log in.", user: toSafeUser(user) });
});

// ------------------------------------------------------------ Steps 5 + 8
export const login = asyncHandler(async (req, res) => {
  const { email, password } = getValidated<LoginBody>(res, "body");

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    // Blocked: the password is not even checked, so a correct one cannot unlock early.
    throw lockedError(res, user.lockedUntil);
  }
  if (user.lockedUntil) {
    // Lock has expired: start again with a clean counter.
    await User.updateOne({ _id: user._id }, { $set: { failedAttempts: 0, lockedUntil: null } });
    user.failedAttempts = 0;
    user.lockedUntil = null;
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);

  if (!passwordOk) {
    const updated = await User.findByIdAndUpdate(
      user._id,
      { $inc: { failedAttempts: 1 } },
      { new: true }
    ).select("failedAttempts");

    if (updated && updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      await User.updateOne({ _id: user._id }, { $set: { lockedUntil } });
      throw lockedError(res, lockedUntil);
    }
    throw new ApiError(401, INVALID_CREDENTIALS);
  }

  if (user.failedAttempts > 0) {
    await User.updateOne({ _id: user._id }, { $set: { failedAttempts: 0, lockedUntil: null } });
  }

  issueSession(res, user);
  res.status(200).json({ user: toSafeUser(user) });
});

// ---------------------------------------------------------------- Step 6
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) {
    clearAuthCookie(res);
    throw new ApiError(401, "Authentication required");
  }
  res.status(200).json({ user: toSafeUser(user) });
});

// Always succeeds, even without a valid session. It only clears this browser's cookie.
export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ message: "Logged out" });
});

// ---------------------------------------------------------------- Step 9
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, secureCode, newPassword } = getValidated<ResetPasswordBody>(res, "body");

  const user = await User.findOne({ email }).select("+secureCodeHash");
  if (!user) {
    await bcrypt.compare(secureCode, DUMMY_HASH);
    throw new ApiError(400, INVALID_RESET);
  }

  const codeOk = await bcrypt.compare(secureCode, user.secureCodeHash);
  if (!codeOk) {
    throw new ApiError(400, INVALID_RESET);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await User.updateOne(
    { _id: user._id },
    {
      $set: { passwordHash, failedAttempts: 0, lockedUntil: null },
      $inc: { tokenVersion: 1 }, // every existing session/JWT stops working
    }
  );

  clearAuthCookie(res);
  res.status(200).json({ message: "Password updated. Please log in with your new password." });
});

// --------------------------------------------------------------- Step 10
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = getValidated<ChangePasswordBody>(res, "body");

  const user = await User.findById(req.user!.id).select("+passwordHash");
  if (!user) throw new ApiError(401, "Authentication required");

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new ApiError(400, "Validation failed", [
      { field: "currentPassword", message: "Current password is incorrect" },
    ]);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const updated = await User.findByIdAndUpdate(
    user._id,
    { $set: { passwordHash }, $inc: { tokenVersion: 1 } },
    { new: true }
  );
  if (!updated) throw new ApiError(401, "Authentication required");

  // Other devices are logged out (tokenVersion changed); this one gets a fresh cookie.
  issueSession(res, updated);
  res.status(200).json({ message: "Password changed. Other devices have been logged out." });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { secureCode } = getValidated<DeleteAccountBody>(res, "body");
  const authUser = req.user!;

  if (authUser.role === "owner") {
    throw new ApiError(403, "The owner account cannot be deleted");
  }

  const user = await User.findById(authUser.id).select("+secureCodeHash");
  if (!user) throw new ApiError(401, "Authentication required");

  if (!(await bcrypt.compare(secureCode, user.secureCodeHash))) {
    throw new ApiError(400, "Validation failed", [
      { field: "secureCode", message: "Secure code is incorrect" },
    ]);
  }

  const userId = user._id;

  // --- Block deletion if it would leave an active tournament inconsistent.
  const reasons: string[] = [];

  const organized = await Tournament.find({
    organizer_id: userId,
    status: { $nin: TERMINAL_TOURNAMENT_STATUSES },
  }).select("name").limit(5).lean();
  for (const t of organized) reasons.push(`You are the organizer of "${t.name}", which is still active.`);

  const captainTournamentIds = await Team.find({ captainUserId: userId }).distinct("tournamentId");
  if (captainTournamentIds.length > 0) {
    const captained = await Tournament.find({
      _id: { $in: captainTournamentIds },
      status: { $nin: TERMINAL_TOURNAMENT_STATUSES },
    }).select("name").limit(5).lean();
    for (const t of captained) reasons.push(`You are a team captain in "${t.name}", which is still active.`);
  }

  const playerTournamentIds = await Player.find({ userId, status: { $ne: "withdrawn" } }).distinct("tournamentId");
  if (playerTournamentIds.length > 0) {
    const playing = await Tournament.find({
      _id: { $in: playerTournamentIds },
      status: { $nin: TERMINAL_TOURNAMENT_STATUSES },
    }).select("name").limit(5).lean();
    for (const t of playing) reasons.push(`You are an accepted player in "${t.name}", which is still active.`);
  }

  if (reasons.length > 0) {
    throw new ApiError(
      409,
      "Your account cannot be deleted while you are involved in an active tournament.",
      reasons.map((message) => ({ field: "account", message }))
    );
  }

  // --- Delete the user and their personal data in one transaction.
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const regs = await PlayerRegistration.find({ userId }).select("tournamentId").session(session).lean();
      const regTournamentIds = regs.map((r) => r.tournamentId);
      const activeRows = regTournamentIds.length
        ? await Tournament.find({
            _id: { $in: regTournamentIds },
            status: { $nin: TERMINAL_TOURNAMENT_STATUSES },
          }).select("_id").session(session).lean()
        : [];
      const activeIds = activeRows.map((t) => t._id);

      // Only withdrawn players can remain in active tournaments at this point.
      await Player.deleteMany({ userId, status: "withdrawn", tournamentId: { $in: activeIds } }, { session });
      await PlayerRegistration.deleteMany({ userId, tournamentId: { $in: activeIds } }, { session });
      // Accepted requests stay: a Tournament references them through request_id.
      await TournamentRequest.deleteMany({ user_id: userId, status: { $ne: "accepted" } }, { session });
      await Notification.deleteMany({ recipientId: userId }, { session });
      await User.deleteOne({ _id: userId, role: "user" }, { session });
    });
  } finally {
    await session.endSession();
  }

  clearAuthCookie(res);
  res.status(200).json({ message: "Your account has been deleted." });
});