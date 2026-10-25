import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'food_app_jwt_token';
const USER_KEY = 'food_app_user_data';

// Cache token trong bộ nhớ: tránh gọi SecureStore (native, bất đồng bộ) ở mọi request API.
// undefined = chưa đọc lần nào.
let cachedToken: string | null | undefined;

export const secureStorage = {
  async getToken(): Promise<string | null> {
    if (cachedToken !== undefined) return cachedToken;
    try {
      if (Platform.OS === 'web') {
        cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
      } else {
        cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Error reading token from SecureStore:', e);
      cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
    }
    return cachedToken;
  },

  async setToken(token: string): Promise<void> {
    cachedToken = token;
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(TOKEN_KEY, token);
        return;
      }
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Error saving token to SecureStore:', e);
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  },

  async removeToken(): Promise<void> {
    cachedToken = null;
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(TOKEN_KEY);
        return;
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('Error deleting token from SecureStore:', e);
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Error reading user data:', e);
      return null;
    }
  },

  async setUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Error saving user data:', e);
    }
  },

  async clearAll(): Promise<void> {
    await this.removeToken();
    await AsyncStorage.removeItem(USER_KEY);
  },
};
