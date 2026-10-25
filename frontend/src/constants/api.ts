import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_PORT = 5000;

const getHostIp = (): string | null => {
  const host =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).experienceUrl;
  if (host) {
    const clean = String(host).replace(/^[a-zA-Z]+:\/\//, '');
    const ip = clean.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  return null;
};

export const getApiBaseUrl = (): string => {
  // 1. Chạy trên Web browser: ưu tiên localhost hoặc EXPO_PUBLIC_API_URL
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return `http://localhost:${BACKEND_PORT}/api`;
    }
    return process.env.EXPO_PUBLIC_API_URL || `http://localhost:${BACKEND_PORT}/api`;
  }

  // 2. Nếu có biến môi trường EXPO_PUBLIC_API_URL cụ thể (ví dụ 192.168.1.5:5000/api)
  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL.trim();
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
  }

  // 3. Tự động lấy IP của máy tính host khi mở qua Expo Go trên thiết bị thật
  const hostIp = getHostIp();
  if (hostIp) {
    return `http://${hostIp}:${BACKEND_PORT}/api`;
  }

  // 4. Fallback mặc định theo mạng Wi-Fi hiện tại của máy chủ phát triển
  return `http://192.168.1.9:${BACKEND_PORT}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    DELETE_ACCOUNT: '/auth/account',
  },
  RECIPES: {
    DISCOVER: '/recipes/discover',
    SEARCH: '/recipes/search',
    DETAILS: (slug: string) => `/recipes/${slug}`,
    FINISH_COOKING: (id: number | string) => `/recipes/${id}/finish-cooking`,
  },
  LIBRARY: {
    SAVED: '/library/saved',
    SAVE: '/library/saved',
    UNSAVE: (recipeId: number | string) => `/library/saved/${recipeId}`,
    MY_RECIPES: '/library/my',
    CREATE_MY_RECIPE: '/library/my',
    UPDATE_MY_RECIPE: (id: number | string) => `/library/my/${id}`,
    DELETE_MY_RECIPE: (id: number | string) => `/library/my/${id}`,
    RESTORE_MY_RECIPE: (id: number | string) => `/library/my/${id}/restore`,
  },
  USER: {
    PREFERENCES: '/user/preferences',
  },
  CHATBOT: {
    DISCOVER: '/chatbot/discover',
  },
};
