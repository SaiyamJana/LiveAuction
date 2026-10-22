import { Schema, model, Types } from "mongoose";
import { PLAYER_STATUSES, PlayerStatus } from "../types/enums.js";


//This model will alter during auction
export interface IPlayer {
  tournamentId: Types.ObjectId;
  userId: Types.ObjectId;
  registrationId: Types.ObjectId;
  displayName: string;
  status: PlayerStatus;
  teamId: Types.ObjectId | null;
  soldPrice: number | null;
}

const schema = new Schema<IPlayer>(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: "Tournament", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: "PlayerRegistration",
      required: true,
      unique: true,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 50 },
    status: { type: String, enum: PLAYER_STATUSES, default: "pending", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    soldPrice: { type: Number, default: null, min: 0 },
  },
  { timestamps: true }
);

schema.index({ tournamentId: 1, userId: 1 }, { unique: true });// unique user per tournament
schema.index({ tournamentId: 1, status: 1 });// for finding players by status in a tournament
schema.index({ teamId: 1 });// for finding players in a team

export const Player = model<IPlayer>("Player", schema);