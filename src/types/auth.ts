import { User } from 'firebase/auth';
import { Environment } from '@/lib/firebase-config';

export interface AuthenticatedUser {
  id: string;
  user: User;
  accessToken: string;
  refreshToken?: string;
  environment: Environment;
  signInTime: number;
  tokenExpiry?: number;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
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

export interface TambolaTicket {
  ticketId: string;
  userId: string;
  tournamentId: string;
  numbers: number[][];
  claims: {
    earlyFive: boolean;
    topLine: boolean;
    middleLine: boolean;
    bottomLine: boolean;
    fullHouse: boolean;
  };
}

