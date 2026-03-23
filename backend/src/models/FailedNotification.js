import mongoose from "mongoose";

/**
 * Stores push notifications that failed to deliver and have been marked as
 * critical. A background job can query `resolved: false` and retry them.
 */
const failedNotificationSchema = new mongoose.Schema(
  {
    pushToken: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    // The structured data payload that was passed with the notification
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    failedAt: {
      type: Date,
      default: Date.now
    },
    // Number of delivery attempts made so far (including the first failure)
    retryCount: {
      type: Number,
      default: 0
    },
    // Last error message from the push service
    lastError: {
      type: String,
      default: ""
    },
    // Set to true once a retry succeeds (or the record is manually dismissed)
    resolved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for the retry job: only scan unresolved records
failedNotificationSchema.index({ resolved: 1, failedAt: 1 });

export default mongoose.model("FailedNotification", failedNotificationSchema);
