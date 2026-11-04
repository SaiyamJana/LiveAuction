import mongoose from "mongoose";
import type { Types } from "mongoose";
import { Tournament, TournamentRequest } from "../models/index.js";
import { getValidated } from "../middleware/validate.js";
import { createNotification } from "../services/notification.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDuplicateKeyField } from "../utils/dbErrors.js";
import { generateUniqueSlug } from "../utils/slug.js";
import type { ObjectIdParams } from "../validators/common.validators.js";
import type { DecisionBody, OwnerRequestsQuery } from "../validators/tournamentRequest.validators.js";
import { toRequestDto } from "./tournamentRequest.controller.js";
import type { RequestLike } from "./tournamentRequest.controller.js";

interface Requester {
  _id: Types.ObjectId;
  username: string;
  email: string;
}

// GET /api/owner/tournament-requests?status=&page=&limit=
export const listRequests = asyncHandler(async (_req, res) => {
  const { status, page, limit } = getValidated<OwnerRequestsQuery>(res, "query");
  const filter = status ? { status } : {};

  const [items, total, pendingCount] = await Promise.all([
    TournamentRequest.find(filter)
      .sort({ sendAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate<{ user_id: Requester | null }>("user_id", "username email") // requester info
      .lean(),
    TournamentRequest.countDocuments(filter),
    TournamentRequest.countDocuments({ status: "pending" }),
  ]);

  res.status(200).json({
    requests: items.map((r) => ({
      ...toRequestDto(r),
      // null when the requester deleted their account after being accepted
      requester: r.user_id ? { id: String(r.user_id._id), username: r.user_id.username, email: r.user_id.email } : null,
    })),
    pendingCount,
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
});

interface DecisionOutcome {
  request: RequestLike & { user_id: Types.ObjectId };
  tournament?: { id: string; name: string; slug: string; status: string };
}

const MAX_SLUG_RETRIES = 3;

// PATCH /api/owner/tournament-requests/:id/decision
export const decideRequest = asyncHandler(async (_req, res) => {
  const { id } = getValidated<ObjectIdParams>(res, "params");
  const { decision, response } = getValidated<DecisionBody>(res, "body");
  const accept = decision === "accept";

  for (let attempt = 1; ; attempt++) {
    const session = await mongoose.startSession();
    try {
      const holder: { value?: DecisionOutcome } = {};

      // request update + tournament + notification: all or nothing.
      await session.withTransaction(async () => {
        holder.value = undefined; // the callback can be re-run on transient errors

        // Atomic "pending -> decided": of two concurrent decisions only one matches.
        const updated = await TournamentRequest.findOneAndUpdate(
          { _id: id, status: "pending" },
          {
            $set: {
              status: accept ? "accepted" : "rejected",
              reviewedAt: new Date(),
              ...(response ? { response } : {}),
            },
          },
          { new: true, session }
        ).lean();

        if (!updated) {
          const existing = await TournamentRequest.findById(id).select("status").session(session).lean();
          if (!existing) throw new ApiError(404, "Tournament request not found");
          throw new ApiError(409, `This request has already been ${existing.status}`);
        }

        let tournament: DecisionOutcome["tournament"];
        if (accept) {
          const slug = await generateUniqueSlug(
            updated.name,
            async (candidate) => (await Tournament.exists({ slug: candidate }).session(session)) !== null
          );
          // contact / teamConfig are optional in the schema, so no placeholder values are needed.
          const [created] = await Tournament.create(
            [
              {
                name: updated.name,
                slug,
                description: updated.description,
                organizer_id: updated.user_id,
                request_id: updated._id,
                status: "draft",
                visibility: "public",
              },
            ],
            { session }
          );
          tournament = { id: String(created._id), name: created.name, slug: created.slug, status: created.status };
        }

        const note = response ? ` Owner's message: ${response}` : "";
        await createNotification(
          updated.user_id,
          "tournament_response",
          accept
            ? `Your tournament request "${updated.name}" was accepted. A draft tournament has been created for you.${note}`
            : `Your tournament request "${updated.name}" was rejected.${note}`,
          session
        );

        holder.value = { request: updated, tournament };
      });

      const outcome = holder.value;
      if (!outcome) throw new Error("Decision did not complete");

      res.status(200).json({
        message: accept ? "Request accepted. A draft tournament was created." : "Request rejected.",
        request: toRequestDto(outcome.request),
        tournament: outcome.tournament ?? null,
      });
      return;
    } catch (err) {
      const duplicateField = getDuplicateKeyField(err);
      // Another tournament took the same slug a moment ago: try again with a new one.
      if (duplicateField === "slug" && attempt < MAX_SLUG_RETRIES) continue;
      // A tournament already exists for this request: it was already decided.
      if (duplicateField === "request_id") throw new ApiError(409, "This request has already been decided");
      throw err;
    } finally {
      await session.endSession();
    }
  }
});
