import type { Types } from "mongoose";
import { Notification } from "../models/index.js";
import { getValidated } from "../middleware/validate.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { ObjectIdParams } from "../validators/common.validators.js";
import type { ListNotificationsQuery } from "../validators/notification.validators.js";

interface NotificationLike {
  _id: Types.ObjectId;
  type: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}

function toDto(n: NotificationLike) {
  return { id: String(n._id), type: n.type, body: n.body, readAt: n.readAt, createdAt: n.createdAt };
}

// GET /api/notifications?page=&limit=
export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = getValidated<ListNotificationsQuery>(res, "query");
  const recipientId = req.user!.id; // always from the session, never from the client

  const [items, total, unreadCount] = await Promise.all([
    Notification.find({ recipientId })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipientId }),
    Notification.countDocuments({ recipientId, readAt: null }),
  ]);

  res.status(200).json({
    notifications: items.map(toDto),
    unreadCount,
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
});

// PATCH /api/notifications/:id/read
export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = getValidated<ObjectIdParams>(res, "params");
  const recipientId = req.user!.id;

  // Filtering by recipientId means another user's notification looks like "not found".
  let notification = await Notification.findOneAndUpdate(
    { _id: id, recipientId, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true }
  ).lean();

  if (!notification) {
    notification = await Notification.findOne({ _id: id, recipientId }).lean(); // already read?
    if (!notification) throw new ApiError(404, "Notification not found");
  }

  const unreadCount = await Notification.countDocuments({ recipientId, readAt: null });
  res.status(200).json({ notification: toDto(notification), unreadCount });
});

// PATCH /api/notifications/read-all
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const recipientId = req.user!.id;
  const result = await Notification.updateMany({ recipientId, readAt: null }, { $set: { readAt: new Date() } });
  res.status(200).json({ updated: result.modifiedCount, unreadCount: 0 });
});
