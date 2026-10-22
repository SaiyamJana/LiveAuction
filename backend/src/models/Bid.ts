import { Schema, model, Types } from "mongoose";

export interface IBid {
  tournamentId: Types.ObjectId;
  playerId: Types.ObjectId;
  teamId: Types.ObjectId;
  amount: number;
  createdAt: Date;
}

const schema = new Schema<IBid>(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: "Tournament", required: true },
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

schema.index({ tournamentId: 1, playerId: 1, createdAt: -1 });// index to quickly find the latest bid for a player in a tournament
schema.index({ teamId: 1 });// index to quickly find all bids made by a team

export const Bid = model<IBid>("Bid", schema);