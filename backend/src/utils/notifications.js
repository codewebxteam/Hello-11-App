import { Expo } from "expo-server-sdk";
import { serverLog } from "./logger.js";
import FailedNotification from "../models/FailedNotification.js";

const expo = new Expo();

/**
 * Send a push notification via Expo.
 * @param {string} pushToken - Valid Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
export const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    serverLog(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  const messages = [{
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'default',
  }];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
    serverLog(`Push notification sent to: ${pushToken}`);
  } catch (error) {
    serverLog(`Error sending push notification: ${error.message}`);
  }
};

/**
 * Safe wrapper around sendPushNotification.
 *
 * - Always logs failures with full context (token, title, error) so they are
 *   never silently swallowed.
 * - When `critical: true`, persists a FailedNotification document so a retry
 *   job can re-deliver the notification later.
 *
 * @param {string} pushToken - Valid Expo push token
 * @param {string} title     - Notification title
 * @param {string} body      - Notification body
 * @param {object} data      - Optional data payload
 * @param {object} options
 * @param {boolean} [options.critical=false] - Persist for retry on failure
 */
export const safeSendNotification = async (
  pushToken,
  title,
  body,
  data = {},
  { critical = false } = {}
) => {
  try {
    await sendPushNotification(pushToken, title, body, data);
  } catch (err) {
    // Always log with enough context to diagnose the failure
    serverLog(
      `[NOTIFICATION FAILED] title="${title}" token=${pushToken} ` +
      `critical=${critical} error=${err.message}`
    );

    // For critical events, persist so they can be retried by a background job
    if (critical) {
      try {
        await FailedNotification.create({
          pushToken,
          title,
          body,
          data,
          failedAt: new Date(),
          retryCount: 0,
          lastError: err.message,
          resolved: false
        });
        serverLog(`[NOTIFICATION FAILED] Persisted to FailedNotification collection for retry.`);
      } catch (dbErr) {
        // DB save failed — log but never throw, notifications must never crash the caller
        serverLog(`[NOTIFICATION FAILED] Could not persist to DB: ${dbErr.message}`);
      }
    }
  }
};

