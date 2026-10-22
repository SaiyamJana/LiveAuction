import { Schema, model, Types } from "mongoose";

export interface IStanding {
  tournamentId: Types.ObjectId;
  stageId: Types.ObjectId;
  groupId?: Types.ObjectId | null;
  teamId: Types.ObjectId;
  details: { played: number; won: number; loss: number; tie: number; no_result: number };
  points: number;
  current_nrr: number;
  position: number;
}

const c = { type: Number, default: 0, min: 0 };

const schema = new Schema<IStanding>(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: "Tournament", required: true },
    stageId: { type: Schema.Types.ObjectId, ref: "Stage", required: true },
    groupId: { type: Schema.Types.ObjectId, default: null },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    details: { played: c, won: c, loss: c, tie: c, no_result: c },
    points: { type: Number, default: 0 }, // can go negative if pointsConfig deducts
    current_nrr: { type: Number, default: 0 },
    position: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

schema.index({ stageId: 1, groupId: 1, teamId: 1 }, { unique: true });// unique team per stage/group
schema.index({ stageId: 1, groupId: 1, position: 1 });// index to query standings by stage/group, sorted by position
schema.index({ tournamentId: 1 });// index to query standings by tournament

export const Standing = model<IStanding>("Standing", schema);