import { Types } from "mongoose";
import type { ClientSession } from "mongoose";
import { Notification } from "../models/index.js";
import type { NotificationType } from "../types/enums.js";

const MAX_BODY_LENGTH = 500; // matches Notification.body maxlength

// Reusable helper for every phase. Pass `session` to make the notification part
// of a MongoDB transaction.
export async function createNotification(
  recipientId: Types.ObjectId | string,
  type: NotificationType,
  body: string,
  session?: ClientSession
) {
  const text = body.trim();
  const safeBody = text.length > MAX_BODY_LENGTH ? `${text.slice(0, MAX_BODY_LENGTH - 1)}…` : text;
  const [notification] = await Notification.create(
    [{ recipientId: new Types.ObjectId(recipientId), type, body: safeBody }],
    session ? { session } : undefined
  );
  return notification;
}
