import asyncHandler from "../utils/asyncHandler.js";
import Notification from "../models/Notification.js";

// ── GET /admin/notifications ──
export const getNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

  const notifications = await Notification.find()
    .sort({ isRead: 1, createdAt: -1 }) // unread first, then newest
    .limit(limit)
    .lean();

  const sanitized = notifications.map((n) => ({
    id: String(n._id),
    type: n.type,
    message: n.message,
    isRead: n.isRead,
    meta: n.meta || {},
    createdAt: n.createdAt
  }));

  const unreadCount = sanitized.filter((n) => !n.isRead).length;

  return res.status(200).json({ notifications: sanitized, unreadCount });
});

// ── PATCH /admin/notifications/read ──
export const markAllRead = asyncHandler(async (_req, res) => {
  await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
  return res.status(200).json({ message: "All notifications marked as read." });
});

// ── DELETE /admin/notifications/:id ──
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found.");
  }
  return res.status(200).json({ message: "Notification dismissed." });
});
