import { Schema, model, Types } from "mongoose";
import {
  MATCH_STATUSES, MatchStatus,
  RESULT_TYPES, ResultType,
} from "../types/enums.js";

interface IBattingStat {
  playerId: Types.ObjectId;
  runs: number;
  bowlsFaced: number;
  four: number;
  six: number;
  isOut: boolean;
}
interface IBowlingStat {
  playerId: Types.ObjectId;
  bowlsBowled: number;
  runsGiven: number;
  maidenBowls: number;
  wickets: number;
}
interface IFallOfWicket {
  runs: number;
  wickets: number;
  over: number;
}
interface IInnings {
  inningsNo: number;
  battingTeamId: Types.ObjectId;
  bowlingTeamId: Types.ObjectId;
  battingstats: IBattingStat[];
  bowlingstats: IBowlingStat[];
  wicketsFallen: IFallOfWicket[];
}

export interface IMatch {
  tournamentId: Types.ObjectId;
  stageId: Types.ObjectId;
  groupId?: Types.ObjectId | null;
  matchNumber: number;
  roundLabel?: string;
  isPlayoff: boolean;
  teamA_id?: Types.ObjectId | null;
  teamB_id?: Types.ObjectId | null;
  teamALabel?: string;
  teamBLabel?: string;
  description?: { venue?: string; resultNote?: string };
  status: MatchStatus;
  result?: { type: ResultType; winnerId?: Types.ObjectId | null };
  scheduledAt?: Date;
  completedAt?: Date;
  innings: IInnings[];
}

const n = (extra = {}) => ({ type: Number, default: 0, min: 0, ...extra });

const inningsSchema = new Schema<IInnings>(
  {
    inningsNo: { type: Number, required: true, min: 1 },
    battingTeamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    bowlingTeamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    battingstats: [
      {
        _id: false,
        playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
        runs: n(),
        bowlsFaced: n(),
        four: n(),
        six: n(),
        isOut: { type: Boolean, default: false },
      },
    ],
    bowlingstats: [
      {
        _id: false,
        playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
        bowlsBowled: n(),
        runsGiven: n(),
        maidenBowls: n(),
        wickets: n(),
      },
    ],
    wicketsFallen: [{ _id: false, runs: n(), wickets: n(), over: n() }],
  },
  { _id: false }
);

const resultSchema = new Schema(
  {
    type: { type: String, enum: RESULT_TYPES, required: true },
    winnerId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
  },
  { _id: false }
);

const schema = new Schema<IMatch>(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: "Tournament", required: true },
    stageId: { type: Schema.Types.ObjectId, ref: "Stage", required: true },
    groupId: { type: Schema.Types.ObjectId, default: null }, // _id of a group inside Stage.groups
    matchNumber: { type: Number, required: true, min: 1 },
    roundLabel: { type: String, trim: true },
    isPlayoff: { type: Boolean, default: false },
    // null until known (e.g. "Winner of SF1" playoff slots)
    teamA_id: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    teamB_id: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    teamALabel: { type: String, trim: true },
    teamBLabel: { type: String, trim: true },
    description: {
      venue: { type: String, trim: true },
      resultNote: { type: String, trim: true },
    },
    status: { type: String, enum: MATCH_STATUSES, default: "scheduled", required: true },
    result: { type: resultSchema, default: undefined },
    scheduledAt: Date,
    completedAt: Date,
    innings: { type: [inningsSchema], default: [] },
  },
  { timestamps: true }
);

schema.index({ tournamentId: 1, stageId: 1, matchNumber: 1 });// unique index to ensure no duplicate match numbers in a stage
schema.index({ tournamentId: 1, status: 1, scheduledAt: 1 });// index to query matches by tournament and status, sorted by scheduled time
schema.index({ teamA_id: 1 });// index to query matches by team A
schema.index({ teamB_id: 1 });// index to query matches by team B

export const Match = model<IMatch>("Match", schema);