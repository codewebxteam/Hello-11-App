import AsyncStorage from "@react-native-async-storage/async-storage";

const DRIVER_TOKEN_KEY = "driver_auth_token";
const DRIVER_DATA_KEY = "driver_data";

// Save driver token
export const setDriverToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(DRIVER_TOKEN_KEY, token);
  } catch (error) {
    console.error("Error saving driver token:", error);
  }
};

// Get driver token
export const getDriverToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(DRIVER_TOKEN_KEY);
  } catch (error) {
    console.error("Error getting driver token:", error);
    return null;
  }
};

// Remove driver token (logout)
export const removeDriverToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DRIVER_TOKEN_KEY);
  } catch (error) {
    console.error("Error removing driver token:", error);
  }
};

// Save driver data
export const setDriverData = async (data: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(DRIVER_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving driver data:", error);
  }
};

// Get driver data
export const getDriverData = async (): Promise<any | null> => {
  try {
    const data = await AsyncStorage.getItem(DRIVER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting driver data:", error);
    return null;
  }
};

// Clear all driver data (logout)
export const clearDriverData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([DRIVER_TOKEN_KEY, DRIVER_DATA_KEY]);
  } catch (error) {
    console.error("Error clearing driver data:", error);
  }
};
