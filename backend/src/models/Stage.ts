import { Schema, model, Types } from "mongoose";
import {
  STAGE_TYPES, StageType,
  STAGE_STATUSES, StageStatus,
  AUTO_MANUAL, AutoManual,
} from "../types/enums.js";

export interface IStageGroup {
  _id: Types.ObjectId;
  name: string;
  order: number;
  teamIds: Types.ObjectId[];
  qualificationCount: number;
}

export interface IStage {
  tournamentId: Types.ObjectId;
  name: string;
  position: number;
  type: StageType;
  status: StageStatus;
  teamIds: Types.ObjectId[];
  fixtureMode: AutoManual;
  allocationMethod: AutoManual;
  groups: IStageGroup[];
}

const groupSchema = new Schema<IStageGroup>({
  name: { type: String, required: true, trim: true },
  order: { type: Number, required: true, min: 0 },
  teamIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
  qualificationCount: { type: Number, default: 0, min: 0 },
}); // _id is created automatically

const schema = new Schema<IStage>(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: "Tournament", required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    position: { type: Number, required: true, min: 1 },
    type: { type: String, enum: STAGE_TYPES, required: true },
    status: { type: String, enum: STAGE_STATUSES, default: "ready", required: true },
    teamIds: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    fixtureMode: { type: String, enum: AUTO_MANUAL, default: "auto" },
    allocationMethod: { type: String, enum: AUTO_MANUAL, default: "auto" },
    groups: { type: [groupSchema], default: [] },
  },
  { timestamps: true }
);

schema.index({ tournamentId: 1, position: 1 }, { unique: true });// unique position per tournament

export const Stage = model<IStage>("Stage", schema);