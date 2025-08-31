const Notification = require("../models/Notification");

// Get user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications

    res.json({
      notifications: notifications.map((notification) => ({
        id: notification._id,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        orderId: notification.orderId,
        createdAt: notification.createdAt,
      })),
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({
      message: "Failed to get notifications",
      error: err.message,
    });
  }
};

// Create notification (for system/admin use)
exports.createNotification = async (req, res) => {
  try {
    const { userId, message, type, orderId } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        message: "User ID and message are required",
      });
    }

    const notification = new Notification({
      userId,
      message,
      type: type || "general",
      orderId,
    });

    await notification.save();

    res.status(201).json({
      message: "Notification created successfully",
      notification: {
        id: notification._id,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        orderId: notification.orderId,
        createdAt: notification.createdAt,
      },
    });
  } catch (err) {
    console.error("Create notification error:", err);
    res.status(500).json({
      message: "Failed to create notification",
      error: err.message,
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      message: "Notification marked as read",
      notification: {
        id: notification._id,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        orderId: notification.orderId,
        createdAt: notification.createdAt,
      },
    });
  } catch (err) {
    console.error("Mark as read error:", err);
    res.status(500).json({
      message: "Failed to mark notification as read",
      error: err.message,
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    res.json({
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error("Mark all as read error:", err);
    res.status(500).json({
      message: "Failed to mark notifications as read",
      error: err.message,
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      message: "Notification deleted successfully",
    });
  } catch (err) {
    console.error("Delete notification error:", err);
    res.status(500).json({
      message: "Failed to delete notification",
      error: err.message,
    });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    res.json({
      unreadCount: count,
    });
  } catch (err) {
    console.error("Get unread count error:", err);
    res.status(500).json({
      message: "Failed to get unread count",
      error: err.message,
    });
  }
};
