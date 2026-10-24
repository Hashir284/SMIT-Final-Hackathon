import Announcement from "../models/Announcement.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { logAction } from "../utils/audit.js";

/**
 * Create announcement (Admin / HR)
 */
export const createAnnouncement = async (req, res) => {
  try {
    const { title, body, target = "all" } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: "Title and body required" });
    }
    const ann = await Announcement.create({
      title,
      body,
      target,
      postedBy: req.user._id,
    });
    await logAction({
      actor: req.user._id,
      action: "create",
      entity: "Announcement",
      entityId: ann._id,
    });
    const recipientRoles =
      target === "hr"
        ? ["HR"]
        : target === "employee"
          ? ["Employee"]
          : ["Admin", "HR", "Employee"];
    const recipients = await User.find({
      role: { $in: recipientRoles },
      isActive: true,
      _id: { $ne: req.user._id },
    }).select("_id");
    if (recipients.length) {
      await Notification.insertMany(
        recipients.map(({ _id }) => ({
          user: _id,
          title: "New announcement",
          message: title,
          link: "/announcements",
        }))
      );
    }
    res.status(201).json({ success: true, announcement: ann });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List announcements (role filtered)
 */
export const getAnnouncements = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user.role === "Employee") {
      filter.target = { $in: ["all", "employee"] };
    } else if (req.user.role === "HR") {
      filter.target = { $in: ["all", "hr", "employee"] };
    }
    // Admin sees all

    const list = await Announcement.find(filter)
      .populate("postedBy", "name role")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, announcements: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete / deactivate announcement
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    ann.isActive = false;
    await ann.save();
    await logAction({
      actor: req.user._id,
      action: "delete",
      entity: "Announcement",
      entityId: ann._id,
    });
    res.json({ success: true, message: "Announcement removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Audit log (Admin only)
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await AuditLog.find()
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({
      success: true,
      notifications,
      unreadCount: notifications.filter((notification) => !notification.readAt).length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { readAt: new Date() },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
