import { Schema, model, Types } from "mongoose";
import {
  ACCOUNT_TYPES, AccountType,
  REGISTRATION_STATUSES, RegistrationStatus,
} from "../types/enums.js";

export interface IPlayerRegistration {
  tournamentId: Types.ObjectId;
  userId: Types.ObjectId;
  actualName: string;
  displayName: string;
  accountType: { type: AccountType; isVerified: boolean };
  contact: { number: string; country: string };
  wantsCaptain: boolean;
  response?: string;
  status: RegistrationStatus;
}

const schema = new Schema<IPlayerRegistration>(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: "Tournament", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actualName: { type: String, required: true, trim: true, maxlength: 80 },
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    accountType: {
      type: { type: String, enum: ACCOUNT_TYPES, required: true },
      isVerified: { type: Boolean, default: false },
    },
    contact: {
      number: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
    },
    wantsCaptain: { type: Boolean, default: false },
    response: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: REGISTRATION_STATUSES, default: "pending", required: true },
  },
  { timestamps: true }
);

schema.index({ tournamentId: 1, userId: 1 }, { unique: true });// unique registration per tournament and user
schema.index({ tournamentId: 1, status: 1 });// index for querying registrations by tournament and status
schema.index({ userId: 1 });// index for querying registrations by user

export const PlayerRegistration = model<IPlayerRegistration>(
  "PlayerRegistration",
  schema
);