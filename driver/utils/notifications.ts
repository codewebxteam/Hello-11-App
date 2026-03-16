import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Configure notifications and return push token (if not in Expo Go)
 */
export async function registerForPushNotificationsAsync() {
  let token;

  try {
    // Dynamically require expo-notifications to avoid side-effect errors in Expo Go SDK 53
    const Notifications = require('expo-notifications');

    // Always set handler to show alerts when app is active
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get notifications permission!');
        return null;
      }
      
      // Check if we are running in Expo Go (remote notifications not supported in SDK 53+)
      const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
      if (isExpoGo) {
        console.log('Expo Go SDK 53+ Detected: Skipping remote push token. System banners for LOCAL notifications are now configured.');
        return null;
      }

      // Use projectId from Expo Constants
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      console.log('Expo Push Token:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  } catch (error: any) {
    console.warn('Error during notification registration:', error.message);
  }

  return token;
}

/**
 * Send a local notification (useful for background alerts in Expo Go)
 */
export async function sendLocalNotification(title: string, body: string, data: any = {}) {
  try {
    const Notifications = require('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: 'high',
      },
      trigger: null, // send immediately
    });
  } catch (error) {
    console.error("Local notification error:", error);
  }
}
