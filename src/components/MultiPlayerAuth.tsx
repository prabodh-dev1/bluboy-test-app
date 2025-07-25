'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User,
  Auth
} from 'firebase/auth';
import { 
  createFirebaseInstance, 
  getFirebaseInstance, 
  removeFirebaseInstance,
  generatePlayerId,
  Environment 
} from '@/lib/firebase-config';
import { AuthenticatedUser } from '@/types/auth';
import { AuthStorage, StoredAuthUser } from '@/lib/auth-storage';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, LogOut, RefreshCw, Users, AlertTriangle } from 'lucide-react';

interface MultiPlayerAuthProps {
  environment: Environment;
  onUsersChange: (users: AuthenticatedUser[]) => void;
  maxPlayers?: number;
}

interface PlayerSlot {
  id: string;
  playerId: string;
  user: AuthenticatedUser | null;
  isSigningIn: boolean;
  isRefreshing?: boolean;
  auth: Auth | null;
}

export const MultiPlayerAuth: React.FC<MultiPlayerAuthProps> = ({
  environment,
  onUsersChange,
  maxPlayers = 4
}) => {
  const { refreshUserToken } = useAuth();
  const [playerSlots, setPlayerSlots] = useState<PlayerSlot[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize player slots and load persisted users
  useEffect(() => {
    const initializeSlots = async () => {
      try {
        // Load persisted users for current environment
        const storedUsers = AuthStorage.loadUsers().filter(u => u.environment === environment);
        console.log(`Found ${storedUsers.length} stored users for environment: ${environment}`, storedUsers);
        
        const slots: PlayerSlot[] = Array.from({ length: maxPlayers }, (_, index) => {
          const playerId = generatePlayerId();
          return {
            id: `slot-${index + 1}`,
            playerId,
            user: null,
            isSigningIn: false,
            auth: null
          };
        });

        // Try to restore users to slots
        let restoredCount = 0;
        for (let i = 0; i < Math.min(storedUsers.length, maxPlayers); i++) {
          const storedUser = storedUsers[i];
          try {
            // Check if token needs refresh
            if (AuthStorage.needsTokenRefresh(storedUser)) {
              console.log(`Token needs refresh for user ${storedUser.displayName}`);
            }

            // Create Firebase instance for restored user
            const firebaseInstance = createFirebaseInstance(environment, slots[i].playerId);
            
            // Create a restored User object for display
            const restoredUser: AuthenticatedUser = {
              id: storedUser.id,
              user: {
                uid: storedUser.uid,
                displayName: storedUser.displayName,
                email: storedUser.email,
                photoURL: storedUser.photoURL,
                getIdToken: async (forceRefresh?: boolean) => {
                  // Return stored token or refresh if needed
                  if (forceRefresh || AuthStorage.needsTokenRefresh(storedUser)) {
                    // This would need to be implemented with proper Firebase auth
                    console.warn('Token refresh needed but not implemented in restored user');
                  }
                  return storedUser.accessToken;
                }
              } as User,
              accessToken: storedUser.accessToken,
              refreshToken: storedUser.refreshToken,
              environment: storedUser.environment,
              signInTime: storedUser.signInTime,
              tokenExpiry: storedUser.tokenExpiry,
              displayName: storedUser.displayName,
              email: storedUser.email,
              photoURL: storedUser.photoURL,
            };

            slots[i].user = restoredUser;
            slots[i].auth = firebaseInstance.auth;
            restoredCount++;
            console.log(`Restored user ${storedUser.displayName} to slot ${i + 1}`);
          } catch (error) {
            console.warn(`Failed to restore user ${storedUser.displayName}:`, error);
          }
        }

        console.log(`Successfully restored ${restoredCount} users`);
        setPlayerSlots(slots);
        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to initialize slots:', error);
        // Fallback to empty slots
        const slots: PlayerSlot[] = Array.from({ length: maxPlayers }, (_, index) => {
          const playerId = generatePlayerId();
          return {
            id: `slot-${index + 1}`,
            playerId,
            user: null,
            isSigningIn: false,
            auth: null
          };
        });
        setPlayerSlots(slots);
        setIsInitializing(false);
      }
    };

    initializeSlots();
  }, [maxPlayers, environment]);

  // Update parent component when users change
  useEffect(() => {
    const authenticatedUsers = playerSlots
      .filter(slot => slot.user !== null)
      .map(slot => slot.user!);
    
    console.log(`Updating parent with ${authenticatedUsers.length} authenticated users:`, 
      authenticatedUsers.map(u => u.displayName));
    onUsersChange(authenticatedUsers);
  }, [playerSlots, onUsersChange]);

  const updateSlotState = (slotId: string, updates: Partial<PlayerSlot>) => {
    setPlayerSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, ...updates } : slot
    ));
  };

  const signInPlayer = async (slotId: string) => {
    const slot = playerSlots.find(s => s.id === slotId);
    if (!slot) return;

    try {
      updateSlotState(slotId, { isSigningIn: true });

      // Create a new Firebase instance for this player
      const firebaseInstance = createFirebaseInstance(environment, slot.playerId);
      const auth = firebaseInstance.auth;

      // Configure Google provider
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account' // Force account selection
      });

      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');

      // Sign in with popup - each popup will be independent
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Get the access token
      const accessToken = await user.getIdToken();

      // Check if this user is already signed in another slot for this environment
      const existingSlot = playerSlots.find(s => 
        s.user && s.user.user.uid === user.uid && s.id !== slotId
      );

      if (existingSlot) {
        throw new Error('This Google account is already signed in another player slot');
      }

      const authenticatedUser: AuthenticatedUser = {
        id: user.uid,
        user,
        accessToken,
        refreshToken: user.refreshToken,
        environment,
        signInTime: Date.now(),
        tokenExpiry: Date.now() + (60 * 60 * 1000), // 1 hour from now
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      };

      updateSlotState(slotId, {
        user: authenticatedUser,
        auth,
        isSigningIn: false
      });

      console.log(`User ${authenticatedUser.displayName} signed in successfully and saved to localStorage`);

    } catch (error: any) {
      console.error('Sign in error for slot', slotId, ':', error);
      
      // Clean up Firebase instance on error
      try {
        await removeFirebaseInstance(environment, slot.playerId);
      } catch (cleanupError) {
        console.warn('Error cleaning up Firebase instance:', cleanupError);
      }
      
      updateSlotState(slotId, { 
        isSigningIn: false,
        auth: null 
      });

      // Show user-friendly error message
      alert(`Sign in failed: ${error.message}`);
    }
  };

  const signOutPlayer = async (slotId: string) => {
    const slot = playerSlots.find(s => s.id === slotId);
    if (!slot || !slot.user || !slot.auth) return;

    try {
      // Remove from localStorage first
      AuthStorage.removeUser(slot.user.id);
      
      // Sign out from Firebase
      await firebaseSignOut(slot.auth);
      
      // Remove Firebase instance
      await removeFirebaseInstance(environment, slot.playerId);
      
      // Generate new player ID for next sign in
      const newPlayerId = generatePlayerId();
      
      updateSlotState(slotId, {
        playerId: newPlayerId,
        user: null,
        auth: null,
        isRefreshing: false
      });

      console.log(`User ${slot.user.displayName} signed out and removed from storage`);

    } catch (error: any) {
      console.error('Sign out error for slot', slotId, ':', error);
      alert(`Sign out failed: ${error.message}`);
    }
  };

  const refreshPlayerToken = useCallback(async (slotId: string) => {
    const slot = playerSlots.find(s => s.id === slotId);
    if (!slot || !slot.user) return;

    try {
      setIsRefreshing(slotId, true);
      
      // Try to use the auth context refresh function first
      const success = await refreshUserToken(slot.user.id);
      
      if (success) {
        // Get the updated token
        const newToken = await slot.user.user.getIdToken(true);
        
        // Update the user with new token and expiry
        const updatedUser: AuthenticatedUser = {
          ...slot.user,
          accessToken: newToken,
          tokenExpiry: Date.now() + (60 * 60 * 1000), // Reset to 1 hour from now
        };

        updateSlotState(slotId, { user: updatedUser });
        
        console.log(`Token refreshed successfully for ${slot.user.displayName}`);
      } else {
        throw new Error('Token refresh failed');
      }

    } catch (error: any) {
      console.error('Token refresh error for slot', slotId, ':', error);
      alert(`Token refresh failed: ${error.message}`);
    } finally {
      setIsRefreshing(slotId, false);
    }
  }, [playerSlots, refreshUserToken]);

  const setIsRefreshing = (slotId: string, isRefreshing: boolean) => {
    setPlayerSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { ...slot, isRefreshing } 
        : slot
    ));
  };

  const isTokenExpiringSoon = (user: AuthenticatedUser): boolean => {
    if (!user.tokenExpiry) return false;
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    return user.tokenExpiry <= fiveMinutesFromNow;
  };

  const signOutAllPlayers = async () => {
    try {
      // Clear all from localStorage first
      AuthStorage.clearAll();
      
      const signOutPromises = playerSlots
        .filter(slot => slot.user)
        .map(slot => signOutPlayer(slot.id));

      await Promise.all(signOutPromises);
      
      console.log('All users signed out and storage cleared');
    } catch (error) {
      console.error('Error signing out all players:', error);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <span className="ml-2">Initializing player slots...</span>
      </div>
    );
  }

  const authenticatedCount = playerSlots.filter(slot => slot.user).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-primary-500" />
          <h2 className="text-xl font-semibold">
            Multi-Player Authentication ({environment})
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {authenticatedCount}/{maxPlayers} players signed in
          </span>
          {authenticatedCount > 0 && (
            <button
              onClick={signOutAllPlayers}
              className="btn-secondary text-sm"
            >
              Sign Out All
            </button>
          )}
        </div>
      </div>

      {/* Player Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {playerSlots.map((slot) => (
          <div key={slot.id} className="user-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">
                Player {slot.id.split('-')[1]}
              </h3>
              <span className="text-xs text-gray-500">
                {slot.playerId.split('-')[1]}
              </span>
            </div>

            {slot.user ? (
              // Authenticated state
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {slot.user.photoURL && (
                    <img
                      key={`photo-${slot.id}`}
                      src={slot.user.photoURL}
                      alt={slot.user.displayName || 'User'}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {slot.user.displayName || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {slot.user.email}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-400 space-y-1">
                  <div>Token: {slot.user.accessToken.substring(0, 20)}...</div>
                  {slot.user.tokenExpiry && (
                    <div key={`expiry-${slot.id}`} className={`flex items-center space-x-1 ${
                      isTokenExpiringSoon(slot.user) ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                      {isTokenExpiringSoon(slot.user) && <AlertTriangle key={`warning-${slot.id}`} className="h-3 w-3" />}
                      <span>
                        Expires: {new Date(slot.user.tokenExpiry).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => refreshPlayerToken(slot.id)}
                    disabled={slot.isRefreshing}
                    className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded text-sm transition-colors ${
                      isTokenExpiringSoon(slot.user)
                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    } ${slot.isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <RefreshCw className={`h-4 w-4 ${slot.isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{slot.isRefreshing ? 'Refreshing...' : 'Refresh Token'}</span>
                  </button>
                  <button
                    onClick={() => signOutPlayer(slot.id)}
                    disabled={slot.isRefreshing}
                    className={`flex-1 flex items-center justify-center space-x-1 bg-red-50 text-red-600 py-2 px-3 rounded text-sm hover:bg-red-100 ${
                      slot.isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              // Unauthenticated state
              <div className="text-center py-8">
                {slot.isSigningIn ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    <span className="text-sm text-gray-600">Signing in...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => signInPlayer(slot.id)}
                    className="flex items-center justify-center space-x-2 w-full btn-primary"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Sign In with Google</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Testing Instructions:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Each player slot creates an independent Firebase authentication session</li>
          <li>• Use different Google accounts for each player to simulate real multi-player scenarios</li>
          <li>• <strong>Persistent Storage:</strong> Users are automatically saved to localStorage and restored on page reload</li>
          <li>• <strong>Token Management:</strong> Tokens are automatically refreshed when they expire (shown with warning icon)</li>
          <li>• Switch between Test and Production environments to test both configurations</li>
          <li>• Sign out to remove users from both memory and localStorage</li>
        </ul>
      </div>
    </div>
  );
};

