import { Expo } from "expo-server-sdk";
import { serverLog } from "./logger.js";

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
 * Send a silent data-only push notification via Expo.
 * This triggers background headless tasks on Android without showing a system tray notification.
 * @param {string} pushToken - Valid Expo push token
 * @param {object} data - Data payload containing routing or action info
 */
export const sendSilentDataNotification = async (pushToken, data = {}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    serverLog(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  const messages = [{
    to: pushToken,
    data,
    priority: 'high',
    // NO title, NO body, NO sound.
    // Setting `contentAvailable: true` helps iOS trigger background fetch if needed.
    contentAvailable: true, 
  }];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
    serverLog(`Silent data push sent to: ${pushToken}`);
  } catch (error) {
    serverLog(`Error sending silent data push: ${error.message}`);
  }
};
