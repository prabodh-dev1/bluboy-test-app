import { User } from 'firebase/auth';
import { Environment } from '@/lib/firebase-config';

export interface AuthenticatedUser {
  id: string;
  user: User;
  accessToken: string;
  refreshToken?: string;
  environment: Environment;
  signInTime: number;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface UserSlot {
  id: string;
  user: AuthenticatedUser | null;
  isSigningIn: boolean;
}

export interface EnvironmentUsers {
  test: AuthenticatedUser[];
  production: AuthenticatedUser[];
}

export interface AuthContextType {
  // Current environment
  currentEnvironment: Environment;
  setCurrentEnvironment: (env: Environment) => void;
  
  // Users by environment
  environmentUsers: EnvironmentUsers;
  
  // Current environment users
  currentUsers: AuthenticatedUser[];
  
  // User slots for UI (max 4 slots for testing)
  userSlots: UserSlot[];
  
  // Authentication actions
  signInUser: (slotId: string) => Promise<void>;
  signOutUser: (slotId: string) => Promise<void>;
  signOutAllUsers: (environment?: Environment) => Promise<void>;
  
  // Utility functions
  getUserBySlotId: (slotId: string) => AuthenticatedUser | null;
  getActiveUsersCount: (environment?: Environment) => number;
  switchUserEnvironment: (userId: string, newEnvironment: Environment) => Promise<void>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export interface TournamentSubscription {
  tournamentId: string;
  userId: string;
  environment: Environment;
  subscriptionTime: number;
  status: 'subscribed' | 'active' | 'completed' | 'cancelled';
}

export interface GameSession {
  sessionId: string;
  tournamentId: string;
  participants: AuthenticatedUser[];
  environment: Environment;
  startTime: number;
  status: 'waiting' | 'active' | 'completed';
}

