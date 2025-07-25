'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Environment, getFirebaseInstance } from '@/lib/firebase-config';
import { AuthenticatedUser } from '@/types/auth';
import { AuthStorage } from '@/lib/auth-storage';

interface AuthContextType {
  // Current environment
  currentEnvironment: Environment;
  setCurrentEnvironment: (env: Environment) => void;
  
  // Current environment users (multiple players for testing)
  authenticatedUsers: AuthenticatedUser[];
  setAuthenticatedUsers: (users: AuthenticatedUser[]) => void;
  
  // Utility functions
  addUser: (user: AuthenticatedUser) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<AuthenticatedUser>) => void;
  clearAllUsers: () => void;
  getUserById: (userId: string) => AuthenticatedUser | null;
  getActiveUsersCount: () => number;
  refreshUserToken: (userId: string) => Promise<boolean>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>('test');
  const [authenticatedUsers, setAuthenticatedUsers] = useState<AuthenticatedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persisted users on app initialization (MultiPlayerAuth handles the actual restoration)
  useEffect(() => {
    const loadPersistedUsers = () => {
      try {
        const storedUsers = AuthStorage.loadUsers();
        const usersForCurrentEnv = storedUsers.filter(u => u.environment === currentEnvironment);
        
        console.log(`Found ${usersForCurrentEnv.length} persisted users for ${currentEnvironment}`);
        // MultiPlayerAuth component will handle full restoration with Firebase instances
      } catch (error) {
        console.warn('Failed to load persisted users:', error);
      }
    };

    loadPersistedUsers();
  }, [currentEnvironment]);

  // Clear users when environment changes
  useEffect(() => {
    setAuthenticatedUsers([]);
    setError(null);
  }, [currentEnvironment]);

  // Save users to localStorage whenever authenticatedUsers changes
  useEffect(() => {
    if (authenticatedUsers.length > 0) {
      AuthStorage.saveUsers(authenticatedUsers);
      console.log(`Saved ${authenticatedUsers.length} users to localStorage:`, 
        authenticatedUsers.map(u => u.displayName));
    }
  }, [authenticatedUsers]);

  const addUser = useCallback((user: AuthenticatedUser) => {
    // Check if user already exists
    const existingUser = authenticatedUsers.find(u => u.id === user.id);
    if (existingUser) {
      setError('User is already authenticated');
      return;
    }

    // Ensure user is for current environment
    if (user.environment !== currentEnvironment) {
      setError('User environment does not match current environment');
      return;
    }

    setAuthenticatedUsers(prev => {
      const newUsers = [...prev, user];
      return newUsers;
    });
    setError(null);
  }, [authenticatedUsers, currentEnvironment]);

  const removeUser = useCallback((userId: string) => {
    setAuthenticatedUsers(prev => {
      const filteredUsers = prev.filter(u => u.id !== userId);
      // Update localStorage
      AuthStorage.removeUser(userId);
      return filteredUsers;
    });
    setError(null);
  }, []);

  const updateUser = useCallback((userId: string, updates: Partial<AuthenticatedUser>) => {
    setAuthenticatedUsers(prev => {
      const updatedUsers = prev.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      );
      return updatedUsers;
    });
  }, []);

  const clearAllUsers = useCallback(() => {
    setAuthenticatedUsers([]);
    AuthStorage.clearAll();
    setError(null);
  }, []);

  const refreshUserToken = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const user = authenticatedUsers.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get fresh token from Firebase
      const newToken = await user.user.getIdToken(true);
      
      // Update user with new token
      const updatedUser = {
        ...user,
        accessToken: newToken,
      };

      // Update in memory
      updateUser(userId, { accessToken: newToken });
      
      // Update in localStorage
      AuthStorage.updateUserToken(userId, newToken, user.refreshToken);
      
      return true;
    } catch (error) {
      console.error('Failed to refresh token for user:', userId, error);
      setError(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }, [authenticatedUsers, updateUser]);

  const getUserById = (userId: string): AuthenticatedUser | null => {
    return authenticatedUsers.find(u => u.id === userId) || null;
  };

  const getActiveUsersCount = (): number => {
    return authenticatedUsers.length;
  };

  const handleEnvironmentChange = (env: Environment) => {
    // Save current users before switching environment
    if (authenticatedUsers.length > 0) {
      AuthStorage.saveUsers(authenticatedUsers);
    }
    
    setCurrentEnvironment(env);
    setError(null);
  };

  const contextValue: AuthContextType = {
    currentEnvironment,
    setCurrentEnvironment: handleEnvironmentChange,
    authenticatedUsers,
    setAuthenticatedUsers,
    addUser,
    removeUser,
    updateUser,
    clearAllUsers,
    getUserById,
    getActiveUsersCount,
    refreshUserToken,
    isLoading,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

