import mongoose from "mongoose";
import type { Types } from "mongoose";
import { TournamentRequest, User } from "../models/index.js";
import { getValidated } from "../middleware/validate.js";
import { createNotification } from "../services/notification.service.js";
import type { RequestStatus } from "../types/enums.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isDuplicateKeyError } from "../utils/dbErrors.js";
import type { ObjectIdParams } from "../validators/common.validators.js";
import type { CreateTournamentRequestBody, MyRequestsQuery } from "../validators/tournamentRequest.validators.js";

export interface RequestLike {
  _id: Types.ObjectId;
  name: string;
  description: string;
  status: RequestStatus;
  response?: string;
  sendAt: Date;
  reviewedAt?: Date | null;
}

// Shared by the user and owner controllers so the shape stays identical.
export function toRequestDto(r: RequestLike) {
  return {
    id: String(r._id),
    name: r.name,
    description: r.description,
    status: r.status,
    response: r.response ?? null,
    submittedAt: r.sendAt,
    reviewedAt: r.reviewedAt ?? null,
  };
}

const PENDING_EXISTS = "You already have a pending tournament request. Wait for a decision or withdraw it first.";

// POST /api/tournament-requests   (role: user)
export const createTournamentRequest = asyncHandler(async (req, res) => {
  const { name, description } = getValidated<CreateTournamentRequestBody>(res, "body");
  const authUser = req.user!;

  if (await TournamentRequest.exists({ user_id: authUser.id, status: "pending" })) {
    throw new ApiError(409, PENDING_EXISTS);
  }

  const owner = await User.findOne({ role: "owner" }).select("_id").lean();

  const session = await mongoose.startSession();
  try {
    const holder: { value?: RequestLike } = {};
    await session.withTransaction(async () => {
      holder.value = undefined;
      const [doc] = await TournamentRequest.create([{ user_id: authUser.id, name, description }], { session });
      holder.value = doc;
      if (owner) {
        await createNotification(
          owner._id,
          "tournament_request",
          `${authUser.username} requested a new tournament: "${name}".`,
          session
        );
      }
    });
    const created = holder.value;
    if (!created) throw new Error("Request was not created");
    res.status(201).json({ message: "Your tournament request has been sent to the owner.", request: toRequestDto(created) });
  } catch (err) {
    // Two simultaneous submissions: the partial unique index (one pending per user) decides.
    if (isDuplicateKeyError(err)) throw new ApiError(409, PENDING_EXISTS);
    throw err;
  } finally {
    await session.endSession();
  }
});

// GET /api/tournament-requests/mine?page=&limit=   (role: user)
export const listMyRequests = asyncHandler(async (req, res) => {
  const { page, limit } = getValidated<MyRequestsQuery>(res, "query");
  const filter = { user_id: req.user!.id };

  const [items, total] = await Promise.all([
    TournamentRequest.find(filter)
      .sort({ sendAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TournamentRequest.countDocuments(filter),
  ]);

  res.status(200).json({ requests: items.map(toRequestDto), page, limit, total, hasMore: page * limit < total });
});

// PATCH /api/tournament-requests/:id/withdraw   (role: user)
export const withdrawRequest = asyncHandler(async (req, res) => {
  const { id } = getValidated<ObjectIdParams>(res, "params");
  const userId = req.user!.id;

  // One atomic step: only the owner of a still-pending request can change it.
  const updated = await TournamentRequest.findOneAndUpdate(
    { _id: id, user_id: userId, status: "pending" },
    { $set: { status: "withdrawn" } },
    { new: true }
  ).lean();

  if (updated) {
    res.status(200).json({ message: "Request withdrawn.", request: toRequestDto(updated) });
    return;
  }

  const existing = await TournamentRequest.findById(id).select("user_id status").lean();
  if (!existing) throw new ApiError(404, "Tournament request not found");
  if (String(existing.user_id) !== userId) throw new ApiError(403, "You can only withdraw your own requests");
  throw new ApiError(409, `This request has already been ${existing.status} and can no longer be withdrawn`);
});
