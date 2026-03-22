import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";
const USER_KEY = "user_data";
const REFRESH_TOKEN_KEY = "refresh_token";

// Check if we can use SecureStore
const canUseSecureStore = Platform.OS !== "web";

// ================= TOKEN VALIDATION =================
// Simple base64 decoder for React Native (doesn't use Node's Buffer)
const base64Decode = (str: string): string => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    
    // Remove padding and ensure length is multiple of 4
    str = str.replace(/=/g, '');
    
    for (let bc = 0, bs: any, buffer, idx = 0; buffer = str.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6) || 0) : 0
    ) {
      buffer = chars.indexOf(buffer);
    }
    return output;
  } catch (error) {
    console.error("Error decoding base64:", error);
    return "";
  }
};

// Decode JWT token (basic decoding - doesn't verify signature)
const decodeToken = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(base64Decode(parts[1]));
    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  // exp is in seconds, convert to milliseconds
  const expiryTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  // Consider token expired if less than 5 minutes remaining
  const bufferTime = 5 * 60 * 1000;
  return currentTime >= expiryTime - bufferTime;
};

// Verify token is valid and not expired
export const isValidToken = async (token: string | null): Promise<boolean> => {
  if (!token) return false;
  return !isTokenExpired(token);
};

// ================= TOKEN =================
export const saveToken = async (token: string): Promise<void> => {
  try {
    // Try to save in secure storage on native platforms
    if (canUseSecureStore) {
      try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        return;
      } catch (secureError) {
        console.warn("Secure storage failed, falling back to AsyncStorage:", secureError);
      }
    }
    // Fallback to AsyncStorage
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("Error saving token:", error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    // Try secure storage first on native platforms
    if (canUseSecureStore) {
      try {
        const secureToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (secureToken) return secureToken;
      } catch (secureError) {
        console.warn("Secure storage read failed, trying AsyncStorage:", secureError);
      }
    }

    // Fallback to AsyncStorage
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

export const saveRefreshToken = async (token: string): Promise<void> => {
  try {
    if (canUseSecureStore) {
      try {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
        return;
      } catch (secureError) {
        console.warn("Secure storage failed, falling back to AsyncStorage");
      }
    }
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error("Error saving refresh token:", error);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (canUseSecureStore) {
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (refreshToken) return refreshToken;
      } catch (secureError) {
        console.warn("Secure storage read failed");
      }
    }
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

export const removeToken = async (): Promise<void> => {
  try {
    if (canUseSecureStore) {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        return;
      } catch (secureError) {
        console.warn("Secure storage delete failed");
      }
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error removing token:", error);
  }
};

export const removeRefreshToken = async (): Promise<void> => {
  try {
    if (canUseSecureStore) {
      try {
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        return;
      } catch (secureError) {
        console.warn("Secure storage delete failed");
      }
    }
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error removing refresh token:", error);
  }
};

// ================= USER DATA =================
export const saveUser = async (user: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Error saving user:", error);
  }
};

export const getUser = async (): Promise<any | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("Error removing user:", error);
  }
};

// ================= CLEAR ALL =================
export const clearStorage = async (): Promise<void> => {
  try {
    // Clear from secure storage on native platforms
    if (canUseSecureStore) {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      } catch (secureError) {
        console.warn("Error clearing secure storage");
      }
    }

    // Clear from AsyncStorage
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, REFRESH_TOKEN_KEY]);
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
};
