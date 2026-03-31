import { Platform } from 'react-native';

// Try to safely access Notifee
let notifee: any;
let AndroidImportance: any = {};
let AndroidVisibility: any = {};
let AndroidCategory: any = {};
let EventType: any = {};

try {
  // We use require to avoid top-level import crashes in some bundlers/environments
  const NotifeeModule = require('@notifee/react-native');
  notifee = NotifeeModule.default || NotifeeModule;
  AndroidImportance = NotifeeModule.AndroidImportance || {};
  AndroidVisibility = NotifeeModule.AndroidVisibility || {};
  AndroidCategory = NotifeeModule.AndroidCategory || {};
  EventType = NotifeeModule.EventType || {};
} catch (e) {
  console.warn('Notifee native module not found. Notifications will be disabled or fallback to Expo Notifications.');
  
  // Provide basic no-ops for mock functionality
  notifee = {
    createChannel: async () => 'mock-channel',
    displayNotification: async () => 'mock-notification',
    getInitialNotification: async () => null,
    onBackgroundEvent: () => {},
    onForegroundEvent: () => { return () => {}; },
    cancelNotification: async () => {},
    cancelAllNotifications: async () => {},
    setBadgeCount: async () => {},
    getBadgeCount: async () => 0,
  };
}

export {
  notifee,
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  EventType
};

export default notifee;
