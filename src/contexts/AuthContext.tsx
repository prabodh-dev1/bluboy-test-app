'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Environment } from '@/lib/firebase-config';
import { AuthenticatedUser } from '@/types/auth';

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

  // Clear users when environment changes
  useEffect(() => {
    setAuthenticatedUsers([]);
    setError(null);
  }, [currentEnvironment]);

  const addUser = (user: AuthenticatedUser) => {
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

    setAuthenticatedUsers(prev => [...prev, user]);
    setError(null);
  };

  const removeUser = (userId: string) => {
    setAuthenticatedUsers(prev => prev.filter(u => u.id !== userId));
    setError(null);
  };

  const updateUser = (userId: string, updates: Partial<AuthenticatedUser>) => {
    setAuthenticatedUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    ));
  };

  const clearAllUsers = () => {
    setAuthenticatedUsers([]);
    setError(null);
  };

  const getUserById = (userId: string): AuthenticatedUser | null => {
    return authenticatedUsers.find(u => u.id === userId) || null;
  };

  const getActiveUsersCount = (): number => {
    return authenticatedUsers.length;
  };

  const handleEnvironmentChange = (env: Environment) => {
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

