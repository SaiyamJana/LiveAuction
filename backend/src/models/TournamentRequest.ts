import { Schema, model, Types } from "mongoose";
import { REQUEST_STATUSES, RequestStatus } from "../types/enums.js";

export interface ITournamentRequest {
  user_id: Types.ObjectId;
  name: string;
  description: string;
  status: RequestStatus;
  response?: string;
  sendAt: Date;
  reviewedAt?: Date | null;
}

const schema = new Schema<ITournamentRequest>({
  user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: REQUEST_STATUSES, default: "pending", required: true },
  response: { type: String, trim: true, maxlength: 1000 },
  sendAt: { type: Date, default: Date.now, required: true },
  reviewedAt: { type: Date, default: null },
});

schema.index({ user_id: 1, status: 1 }); // for getting user requests by status
schema.index({ status: 1, sendAt: -1 }); // for getting latest requests by status

export const TournamentRequest = model<ITournamentRequest>("TournamentRequest", schema);