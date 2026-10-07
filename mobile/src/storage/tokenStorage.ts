import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'user_jwt_token';
const USER_KEY = 'user_profile_data';

export const tokenStorage = {
  async saveToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
        return;
      }
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.warn('saveToken error:', e);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('getToken error:', e);
      return null;
    }
  },

  async deleteToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        return;
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.warn('deleteToken error:', e);
    }
  },

  async saveUser(user: any): Promise<void> {
    try {
      const data = JSON.stringify(user);
      if (Platform.OS === 'web') {
        localStorage.setItem(USER_KEY, data);
        return;
      }
      await SecureStore.setItemAsync(USER_KEY, data);
    } catch (e) {
      console.warn('saveUser error:', e);
    }
  },

  async getUser(): Promise<any | null> {
    try {
      let data: string | null = null;
      if (Platform.OS === 'web') {
        data = localStorage.getItem(USER_KEY);
      } else {
        data = await SecureStore.getItemAsync(USER_KEY);
      }
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('getUser error:', e);
      return null;
    }
  }
};
