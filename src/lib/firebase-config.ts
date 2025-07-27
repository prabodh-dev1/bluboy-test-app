import { initializeApp, FirebaseApp, deleteApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";

// Test environment Firebase configuration
const testFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_TEST_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_TEST_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_TEST_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_TEST_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_TEST_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_TEST_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_TEST_MEASUREMENT_ID!
};

// Production environment Firebase configuration
const prodFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_PROD_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_PROD_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROD_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_PROD_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_PROD_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_PROD_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_PROD_MEASUREMENT_ID!
};

export type Environment = 'test' | 'production';

// Store multiple Firebase instances for multi-player testing
interface FirebaseInstance {
  app: FirebaseApp;
  auth: Auth;
  analytics: Analytics | null;
  environment: Environment;
  playerId: string;
}

const firebaseInstances = new Map<string, FirebaseInstance>();

export const createFirebaseInstance = (environment: Environment, playerId: string): FirebaseInstance => {
  const config = environment === 'test' ? testFirebaseConfig : prodFirebaseConfig;
  const instanceId = `${environment}-${playerId}`;
  
  // Check if instance already exists
  if (firebaseInstances.has(instanceId)) {
    return firebaseInstances.get(instanceId)!;
  }
  
  // Create new Firebase app instance with unique name
  const app = initializeApp(config, instanceId);
  const auth = getAuth(app);
  
  // Initialize Analytics only in browser environment
  let analytics: Analytics | null = null;
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }
  
  const instance: FirebaseInstance = {
    app,
    auth,
    analytics,
    environment,
    playerId
  };
  
  firebaseInstances.set(instanceId, instance);
  return instance;
};

export const getFirebaseInstance = (environment: Environment, playerId: string): FirebaseInstance | null => {
  const instanceId = `${environment}-${playerId}`;
  return firebaseInstances.get(instanceId) || null;
};

export const removeFirebaseInstance = async (environment: Environment, playerId: string): Promise<void> => {
  const instanceId = `${environment}-${playerId}`;
  const instance = firebaseInstances.get(instanceId);
  
  if (instance) {
    // Clean up the instance
    try {
      await deleteApp(instance.app);
    } catch (error) {
      console.warn('Error deleting Firebase app:', error);
    }
    firebaseInstances.delete(instanceId);
  }
};

export const getAllFirebaseInstances = (environment?: Environment): FirebaseInstance[] => {
  const instances = Array.from(firebaseInstances.values());
  return environment ? instances.filter(instance => instance.environment === environment) : instances;
};

export const getFirebaseConfig = (environment: Environment) => {
  return environment === 'test' ? testFirebaseConfig : prodFirebaseConfig;
};

// Utility function to generate unique player IDs
export const generatePlayerId = (): string => {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

