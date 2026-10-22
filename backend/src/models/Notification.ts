import { Schema, model, Types } from "mongoose";
import { NOTIFICATION_TYPES, NotificationType } from "../types/enums.js";

export interface INotification {
  recipientId: Types.ObjectId;
  type: NotificationType;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}

const schema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
        type: String,
        enum: NOTIFICATION_TYPES,
        required: true,
        trim: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 500 },
    readAt: { type: Date, default: null }, // null = unread
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

schema.index({ recipientId: 1, readAt: 1, createdAt: -1 });// index to quickly find all unread notifications for a user

export const Notification = model<INotification>("Notification", schema);