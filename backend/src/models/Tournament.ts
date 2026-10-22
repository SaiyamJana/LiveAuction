import { Schema, model, Types } from "mongoose";
import {
  VISIBILITIES, Visibility,
  TOURNAMENT_STATUSES, TournamentStatus,
} from "../types/enums.js";

export interface ITournament {
  name: string;
  slug: string;
  description?: string;
  organizer_id: Types.ObjectId;
  request_id: Types.ObjectId;
  visibility: Visibility;
  status: TournamentStatus;
  tournament_timeline: {
    registrationStart?: Date;
    registrationClose?: Date;
    auctionStart?: Date;
    tournamentStart?: Date;
  };
  contact: { name: string; phone: string };
  teamConfig: { totalTeams: number; maxPlayers: number; minPlayers: number };
  pointsConfig: { win: number; loss: number; tie: number; noresult: number };
  currentStage?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ITournament>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 3000 },
    organizer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    request_id: {
      type: Schema.Types.ObjectId,
      ref: "TournamentRequest",
      required: true,
      unique: true, // one tournament per approved request
    },
    visibility: { type: String, enum: VISIBILITIES, default: "public", required: true },
    status: { type: String, enum: TOURNAMENT_STATUSES, default: "draft", required: true },
    tournament_timeline: {
      registrationStart: Date,
      registrationClose: Date,
      auctionStart: Date,
      tournamentStart: Date,
    },
    contact: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    teamConfig: {
      totalTeams: { type: Number, required: true, min: 2 },
      maxPlayers: { type: Number, required: true, min: 1 },
      minPlayers: { type: Number, required: true, min: 1 },
    },
    pointsConfig: {
      win: { type: Number, default: 2 },
      loss: { type: Number, default: 0 },
      tie: { type: Number, default: 1 },
      noresult: { type: Number, default: 1 },
    },
    currentStage: { type: Schema.Types.ObjectId, ref: "Stage", default: null },
  },
  { timestamps: true }
);

schema.index({ organizer_id: 1 }); // for organizer's tournaments
schema.index({ visibility: 1, status: 1, createdAt: -1 }); // for listing latest tournaments based on visibility and status

export const Tournament = model<ITournament>("Tournament", schema);