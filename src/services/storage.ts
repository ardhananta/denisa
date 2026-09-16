import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'denisa_jwt_token';
const USER_KEY = 'denisa_user_profile';
const SESSION_KEY = 'denisa_active_session';
const CHILD_KEY = 'denisa_active_child';

// In-memory fallback if SecureStore is not supported (e.g. some web environments)
const memoryStore: Record<string, string> = {};

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
  return await SecureStore.isAvailableAsync();
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      await SecureStore.setItemAsync(key, value);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      memoryStore[key] = value;
    }
  } catch (error) {
    console.warn(`[storage] Failed to set ${key}:`, error);
    memoryStore[key] = value;
  }
}

async function getItem(key: string): Promise<string | null> {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      return await SecureStore.getItemAsync(key);
    } else if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    } else {
      return memoryStore[key] ?? null;
    }
  } catch (error) {
    console.warn(`[storage] Failed to get ${key}:`, error);
    return memoryStore[key] ?? null;
  }
}

async function deleteItem(key: string): Promise<void> {
  try {
    const available = await isSecureStoreAvailable();
    if (available) {
      await SecureStore.deleteItemAsync(key);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    } else {
      delete memoryStore[key];
    }
  } catch (error) {
    console.warn(`[storage] Failed to delete ${key}:`, error);
    delete memoryStore[key];
  }
}

export interface StoredUser {
  uid: string;
  email: string;
  display_name: string;
  is_profile_completed: boolean;
  registration_step?: string;
}

export interface StoredSession {
  id: string;
  child_id: string;
  child_name?: string;
  instrument_type: string;
  status: string;
  current_question_id?: number;
  total_questions?: number;
  first_question?: string;
  audio_base64?: string;
}

export const storageService = {
  // Token
  async setToken(token: string): Promise<void> {
    await setItem(TOKEN_KEY, token);
  },
  async getToken(): Promise<string | null> {
    return await getItem(TOKEN_KEY);
  },
  async clearToken(): Promise<void> {
    await deleteItem(TOKEN_KEY);
  },

  // User Profile
  async setUser(user: StoredUser): Promise<void> {
    await setItem(USER_KEY, JSON.stringify(user));
  },
  async getUser(): Promise<StoredUser | null> {
    const raw = await getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },
  async clearUser(): Promise<void> {
    await deleteItem(USER_KEY);
  },

  // Active Session
  async setActiveSession(session: StoredSession): Promise<void> {
    await setItem(SESSION_KEY, JSON.stringify(session));
  },
  async getActiveSession(): Promise<StoredSession | null> {
    const raw = await getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  },
  async clearActiveSession(): Promise<void> {
    await deleteItem(SESSION_KEY);
  },

  // Active Child
  async setActiveChild(child: any): Promise<void> {
    await setItem(CHILD_KEY, JSON.stringify(child));
  },
  async getActiveChild(): Promise<any | null> {
    const raw = await getItem(CHILD_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  async clearActiveChild(): Promise<void> {
    await deleteItem(CHILD_KEY);
  },

  // Full Logout
  async clearAll(): Promise<void> {
    await Promise.all([
      deleteItem(TOKEN_KEY),
      deleteItem(USER_KEY),
      deleteItem(SESSION_KEY),
      deleteItem(CHILD_KEY),
    ]);
  },
};
