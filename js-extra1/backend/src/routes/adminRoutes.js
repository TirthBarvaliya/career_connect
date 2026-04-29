import { Router } from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getAdminStats,
  getUsers,
  blockUser,
  unblockUser,
  deleteUser,
  getJobs,
  deleteJob,
  flagJob
} from "../controllers/adminController.js";
import {
  getNotifications,
  markAllRead,
  deleteNotification
} from "../controllers/notificationController.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, authorize("admin"));

// Stats
router.get("/stats", getAdminStats);

// Users
router.get("/users", getUsers);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);
router.delete("/users/:id", deleteUser);

// Jobs
router.get("/jobs", getJobs);
router.delete("/jobs/:id", deleteJob);
router.patch("/jobs/:id/flag", flagJob);

// Notifications
router.get("/notifications", getNotifications);
router.patch("/notifications/read", markAllRead);
router.delete("/notifications/:id", deleteNotification);

export default router;

