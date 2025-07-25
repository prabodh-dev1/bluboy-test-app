import { AuthenticatedUser } from '@/types/auth';
import { Environment } from '@/lib/firebase-config';

const STORAGE_KEY = 'tambola_auth_users';
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before token expires

export interface StoredAuthUser {
  id: string;
  accessToken: string;
  refreshToken?: string;
  environment: Environment;
  signInTime: number;
  tokenExpiry: number;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

export class AuthStorage {
  /**
   * Save authenticated users to localStorage
   */
  static saveUsers(users: AuthenticatedUser[]): void {
    try {
      const storedUsers: StoredAuthUser[] = users.map(user => ({
        id: user.id,
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        environment: user.environment,
        signInTime: user.signInTime,
        tokenExpiry: user.tokenExpiry || (user.signInTime + (60 * 60 * 1000)), // Use existing expiry or 1 hour from sign in
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.user.uid,
      }));

      console.log(`Saving ${users.length} users to localStorage:`, storedUsers.map(u => u.displayName));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedUsers));
    } catch (error) {
      console.warn('Failed to save auth users to localStorage:', error);
    }
  }

  /**
   * Load authenticated users from localStorage
   */
  static loadUsers(): StoredAuthUser[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const users: StoredAuthUser[] = JSON.parse(stored);
      
      // Filter out expired tokens (beyond buffer time)
      const validUsers = users.filter(user => 
        user.tokenExpiry > Date.now() + TOKEN_EXPIRY_BUFFER
      );

      // Update storage if we removed any expired users
      if (validUsers.length !== users.length) {
        console.log(`Removed ${users.length - validUsers.length} expired users from localStorage`);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validUsers));
      }

      return validUsers;
    } catch (error) {
      console.warn('Failed to load auth users from localStorage:', error);
      return [];
    }
  }

  /**
   * Update a specific user's token in localStorage
   */
  static updateUserToken(userId: string, accessToken: string, refreshToken?: string): void {
    try {
      const users = this.loadUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex].accessToken = accessToken;
        users[userIndex].tokenExpiry = Date.now() + (60 * 60 * 1000); // Reset expiry to 1 hour
        if (refreshToken) {
          users[userIndex].refreshToken = refreshToken;
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      }
    } catch (error) {
      console.warn('Failed to update user token in localStorage:', error);
    }
  }

  /**
   * Remove a specific user from localStorage
   */
  static removeUser(userId: string): void {
    try {
      const users = this.loadUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredUsers));
    } catch (error) {
      console.warn('Failed to remove user from localStorage:', error);
    }
  }

  /**
   * Clear all users from localStorage
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear auth users from localStorage:', error);
    }
  }

  /**
   * Check if a user's token needs refresh (within buffer time)
   */
  static needsTokenRefresh(user: StoredAuthUser): boolean {
    return user.tokenExpiry <= Date.now() + TOKEN_EXPIRY_BUFFER;
  }

  /**
   * Convert stored users back to AuthenticatedUser format (partial)
   */
  static convertToAuthenticatedUsers(storedUsers: StoredAuthUser[]): Partial<AuthenticatedUser>[] {
    return storedUsers.map(stored => ({
      id: stored.id,
      accessToken: stored.accessToken,
      refreshToken: stored.refreshToken,
      environment: stored.environment,
      signInTime: stored.signInTime,
      displayName: stored.displayName,
      email: stored.email,
      photoURL: stored.photoURL,
    }));
  }
} 