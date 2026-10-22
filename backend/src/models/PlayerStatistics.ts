import { Schema, model, Types } from "mongoose";

export interface IPlayerStatistics {
  tournamentId: Types.ObjectId;
  playerId: Types.ObjectId;
  batting: {
    matches: number; 
    innings: number; 
    runs: number; 
    bowls: number;
    fours: number; 
    sixes: number;
    highScore: number; 
    notOuts: number;
  };
  bowling: {
    matches: number; 
    bowlsBowled: number; 
    wicketsTaken: number; 
    runGiven: number;
    bestFigures: { wicket: number; runsGiven: number };
  };
}

const c = { type: Number, default: 0, min: 0 };

const schema = new Schema<IPlayerStatistics>(
  {
    tournamentId: { type: Schema.Types.ObjectId, ref: "Tournament", required: true },
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    batting: {
      matches: c, innings: c, runs: c, bowls: c,
      fours: c, sixes: c, highScore: c, notOuts: c,
    },
    bowling: {
      matches: c, bowlsBowled: c, wicketsTaken: c, runGiven: c,
      bestFigures: { wicket: c, runsGiven: c },
    },
  },
  { timestamps: true }
);

schema.index({ tournamentId: 1, playerId: 1 }, { unique: true });// unique player statistics per tournament
schema.index({ tournamentId: 1, "batting.runs": -1 });         // top run scorers
schema.index({ tournamentId: 1, "bowling.wicketsTaken": -1 }); // top wicket takers

export const PlayerStatistics = model<IPlayerStatistics>("PlayerStatistics", schema);