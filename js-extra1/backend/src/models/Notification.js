import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "new_user",
        "new_job",
        "user_blocked",
        "user_unblocked",
        "user_deleted",
        "job_deleted",
        "job_flagged"
      ]
    },
    message: {
      type: String,
      required: true,
      maxlength: 300
    },
    isRead: {
      type: Boolean,
      default: false
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: { expires: 0 } // MongoDB TTL — auto-deletes when expiresAt is reached
    }
  },
  { timestamps: true }
);

// Index for efficient admin fetch (newest first, unread first)
notificationSchema.index({ isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
