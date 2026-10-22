import { Schema, model, Types } from "mongoose";
import {
  AUCTION_STATUSES, AuctionStatus,
  AUTO_MANUAL, AutoManual,
} from "../types/enums.js";

export interface IAuction {
  tournamentId: Types.ObjectId;
  status: AuctionStatus;
  timeline: Date[];
  purseDetails: { totalPurse: number; basePrice: number };
  timer: number; // seconds between organizer's final call and "unsold" announcement
  bidIncrement: { currentPrice: number; increment: number }[];
  playerOrder: AutoManual;
  currentPlayerId: Types.ObjectId | null;
  currentOrder: number;
  currentAmount: number;
  currentTeamId: Types.ObjectId | null;
}

const schema = new Schema<IAuction>(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      unique: true, // one auction per tournament
    },
    status: { type: String, enum: AUCTION_STATUSES, default: "draft", required: true },
    timeline: { type: [Date], default: [] },
    purseDetails: {
      totalPurse: { type: Number, required: true, min: 0 },
      basePrice: { type: Number, required: true, min: 0 },
    },
    timer: { type: Number, default: 10, min: 1 },
    bidIncrement: [
      {
        _id: false,
        currentPrice: { type: Number, required: true, min: 0 },
        increment: { type: Number, required: true, min: 1 },
      },
    ],
    playerOrder: { type: String, enum: AUTO_MANUAL, default: "auto" },
    currentPlayerId: { type: Schema.Types.ObjectId, ref: "Player", default: null },
    currentOrder: { type: Number, default: 0, min: 0 },
    currentAmount: { type: Number, default: 0, min: 0 },
    currentTeamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
  },
  { timestamps: true }
);

export const Auction = model<IAuction>("Auction", schema);