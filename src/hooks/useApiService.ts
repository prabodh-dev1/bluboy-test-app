'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ApiService, Tournament } from '@/lib/api-config';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedUser } from '@/types/auth';

export interface ApiServiceHook {
  apiService: ApiService;
  isLoading: boolean;
  error: string | null;
  
  // Tournament operations
  fetchTournaments: (userId?: string) => Promise<Tournament[]>;
  fetchTambolaTournaments: (userId?: string) => Promise<Tournament[]>;
  fetchUpcomingTournaments: (userId?: string) => Promise<Tournament[]>;
  fetchActiveTournaments: (userId?: string) => Promise<Tournament[]>;
  
  // Utility functions
  refreshTokenForUser: (userId: string) => Promise<string>;
  getAuthTokenForUser: (userId: string) => string | null;
}

export const useApiService = (): ApiServiceHook => {
  const { currentEnvironment, authenticatedUsers, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create API service instance for current environment
  const apiService = useMemo(() => {
    return new ApiService(currentEnvironment);
  }, [currentEnvironment]);

  // Update API service when environment changes
  useEffect(() => {
    apiService.switchEnvironment(currentEnvironment);
  }, [currentEnvironment, apiService]);

  const getAuthTokenForUser = useCallback((userId: string): string | null => {
    const user = authenticatedUsers.find(u => u.id === userId);
    return user?.accessToken || null;
  }, [authenticatedUsers]);

  const refreshTokenForUser = useCallback(async (userId: string): Promise<string> => {
    const user = authenticatedUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    try {
      // Refresh the Firebase token
      const newToken = await user.user.getIdToken(true);
      
      // Update the user's token in the context
      updateUser(userId, { accessToken: newToken });
      
      return newToken;
    } catch (err) {
      console.error('Token refresh failed:', err);
      throw new Error('Failed to refresh authentication token');
    }
  }, [authenticatedUsers, updateUser]);

  const executeWithAuth = useCallback(async <T>(
    operation: (token: string) => Promise<T>,
    userId?: string
  ): Promise<T> => {
    try {
      setError(null);
      setIsLoading(true);

      // Use the first available user if no specific user ID provided
      const targetUserId = userId || authenticatedUsers[0]?.id;
      
      if (!targetUserId) {
        throw new Error('No authenticated users available. Please sign in at least one player.');
      }

      let authToken = getAuthTokenForUser(targetUserId);
      
      if (!authToken) {
        throw new Error('No authentication token available for user');
      }

      try {
        return await operation(authToken);
      } catch (err: any) {
        // If token expired, try to refresh
        if (err.message?.includes('401') || err.message?.includes('unauthorized')) {
          console.log('Token expired, attempting refresh...');
          authToken = await refreshTokenForUser(targetUserId);
          return await operation(authToken);
        }
        throw err;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'API operation failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedUsers, getAuthTokenForUser, refreshTokenForUser]);

  const fetchTournaments = useCallback(async (userId?: string): Promise<Tournament[]> => {
    return executeWithAuth(async (token) => {
      const response = await apiService.getAppConfig(token);
      return response.tournaments;
    }, userId);
  }, [executeWithAuth, apiService]);

  const fetchTambolaTournaments = useCallback(async (userId?: string): Promise<Tournament[]> => {
    return executeWithAuth(async (token) => {
      return await apiService.getTambolaTournaments(token);
    }, userId);
  }, [executeWithAuth, apiService]);

  const fetchUpcomingTournaments = useCallback(async (userId?: string): Promise<Tournament[]> => {
    return executeWithAuth(async (token) => {
      return await apiService.getUpcomingTambolaTournaments(token);
    }, userId);
  }, [executeWithAuth, apiService]);

  const fetchActiveTournaments = useCallback(async (userId?: string): Promise<Tournament[]> => {
    return executeWithAuth(async (token) => {
      return await apiService.getActiveTambolaTournaments(token);
    }, userId);
  }, [executeWithAuth, apiService]);

  return {
    apiService,
    isLoading,
    error,
    fetchTournaments,
    fetchTambolaTournaments,
    fetchUpcomingTournaments,
    fetchActiveTournaments,
    refreshTokenForUser,
    getAuthTokenForUser
  };
};

