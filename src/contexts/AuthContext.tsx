'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { initializeFirebase, getCurrentFirebaseInstances, Environment } from '@/lib/firebase-config';
import { 
  AuthContextType, 
  AuthenticatedUser, 
  UserSlot, 
  EnvironmentUsers 
} from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>('test');
  const [environmentUsers, setEnvironmentUsers] = useState<EnvironmentUsers>({
    test: [],
    production: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Firebase for the current environment
  useEffect(() => {
    try {
      initializeFirebase(currentEnvironment);
    } catch (err) {
      console.error('Failed to initialize Firebase:', err);
      setError('Failed to initialize Firebase');
    }
  }, [currentEnvironment]);

  // Create user slots (4 slots for testing multiple users)
  const createUserSlots = (): UserSlot[] => {
    const currentUsers = environmentUsers[currentEnvironment];
    return Array.from({ length: 4 }, (_, index) => ({
      id: `slot-${index + 1}`,
      user: currentUsers[index] || null,
      isSigningIn: false
    }));
  };

  const [userSlots, setUserSlots] = useState<UserSlot[]>(createUserSlots());

  // Update user slots when environment or users change
  useEffect(() => {
    setUserSlots(createUserSlots());
  }, [currentEnvironment, environmentUsers]);

  const updateSlotSignInState = (slotId: string, isSigningIn: boolean) => {
    setUserSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, isSigningIn } : slot
    ));
  };

  const signInUser = async (slotId: string): Promise<void> => {
    try {
      setError(null);
      updateSlotSignInState(slotId, true);

      const { auth } = getCurrentFirebaseInstances();
      const provider = new GoogleAuthProvider();
      
      // Force account selection to allow multiple accounts
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get the access token
      const accessToken = await user.getIdToken();

      // Check if user is already signed in for this environment
      const existingUser = environmentUsers[currentEnvironment].find(
        u => u.user.uid === user.uid
      );

      if (existingUser) {
        setError('User is already signed in for this environment');
        return;
      }

      const authenticatedUser: AuthenticatedUser = {
        id: user.uid,
        user,
        accessToken,
        environment: currentEnvironment,
        signInTime: Date.now(),
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      };

      // Add user to the current environment
      setEnvironmentUsers(prev => ({
        ...prev,
        [currentEnvironment]: [...prev[currentEnvironment], authenticatedUser]
      }));

    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      updateSlotSignInState(slotId, false);
    }
  };

  const signOutUser = async (slotId: string): Promise<void> => {
    try {
      setError(null);
      const slot = userSlots.find(s => s.id === slotId);
      
      if (!slot?.user) {
        return;
      }

      const userId = slot.user.id;

      // Remove user from current environment
      setEnvironmentUsers(prev => ({
        ...prev,
        [currentEnvironment]: prev[currentEnvironment].filter(u => u.id !== userId)
      }));

      // Note: We don't call firebaseSignOut here because it would sign out all users
      // Instead, we just remove the user from our local state
      
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
    }
  };

  const signOutAllUsers = async (environment?: Environment): Promise<void> => {
    try {
      setError(null);
      const targetEnv = environment || currentEnvironment;

      setEnvironmentUsers(prev => ({
        ...prev,
        [targetEnv]: []
      }));

      // If signing out current environment users, also sign out from Firebase
      if (!environment || environment === currentEnvironment) {
        try {
          const { auth } = getCurrentFirebaseInstances();
          await firebaseSignOut(auth);
        } catch (err) {
          console.warn('Firebase sign out error:', err);
        }
      }

    } catch (err: any) {
      console.error('Sign out all error:', err);
      setError(err.message || 'Failed to sign out all users');
    }
  };

  const getUserBySlotId = (slotId: string): AuthenticatedUser | null => {
    const slot = userSlots.find(s => s.id === slotId);
    return slot?.user || null;
  };

  const getActiveUsersCount = (environment?: Environment): number => {
    const targetEnv = environment || currentEnvironment;
    return environmentUsers[targetEnv].length;
  };

  const switchUserEnvironment = async (userId: string, newEnvironment: Environment): Promise<void> => {
    try {
      setError(null);
      
      // Find user in current environment
      const user = environmentUsers[currentEnvironment].find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found in current environment');
      }

      // Remove from current environment
      setEnvironmentUsers(prev => ({
        ...prev,
        [currentEnvironment]: prev[currentEnvironment].filter(u => u.id !== userId)
      }));

      // Re-authenticate for new environment
      setCurrentEnvironment(newEnvironment);
      
      // The user will need to sign in again for the new environment
      
    } catch (err: any) {
      console.error('Switch environment error:', err);
      setError(err.message || 'Failed to switch environment');
    }
  };

  const handleEnvironmentChange = (env: Environment) => {
    setCurrentEnvironment(env);
    setError(null);
  };

  const contextValue: AuthContextType = {
    currentEnvironment,
    setCurrentEnvironment: handleEnvironmentChange,
    environmentUsers,
    currentUsers: environmentUsers[currentEnvironment],
    userSlots,
    signInUser,
    signOutUser,
    signOutAllUsers,
    getUserBySlotId,
    getActiveUsersCount,
    switchUserEnvironment,
    isLoading,
    error
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

