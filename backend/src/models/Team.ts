import { Schema, model, Types } from "mongoose";
//not storing playerIds in team model, as it can be derived from player model using tournamentId and teamId

//This model will alter during auction
export interface ITeam {
  tournamentId: Types.ObjectId;
  name: string;
  shortCode: string;
  captainUserId: Types.ObjectId | null;
  purse: { initial: number; current: number };
  squadCount: number;
}

const schema = new Schema<ITeam>(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: "Tournament", required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    shortCode: { type: String, required: true, trim: true, uppercase: true, maxlength: 6 },
    captainUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    purse: {
      initial: { type: Number, required: true, min: 0 },
      current: { type: Number, required: true, min: 0 },
    },
    squadCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

schema.index({ tournamentId: 1, shortCode: 1 }, { unique: true });// unique shortCode per tournament
schema.index({ tournamentId: 1, name: 1 }, { unique: true });// unique name per tournament
schema.index({ captainUserId: 1 });// for finding teams where a user is captain

export const Team = model<ITeam>("Team", schema);