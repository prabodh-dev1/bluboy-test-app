import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";

// Test environment Firebase configuration
const testFirebaseConfig = {
  apiKey: "AIzaSyAKSq8rOW5fcGj7OUr4Il619kT_08gEZsA",
  authDomain: "bluboy-test.firebaseapp.com",
  projectId: "bluboy-test",
  storageBucket: "bluboy-test.firebasestorage.app",
  messagingSenderId: "407239566673",
  appId: "1:407239566673:web:459e978a17072c92929f70",
  measurementId: "G-FQ6TX394YK"
};

// Production environment Firebase configuration
const prodFirebaseConfig = {
  apiKey: "AIzaSyBfJvX0eEcUqIJHn1zPVmRzoe45hJqcM6Y",
  authDomain: "bluboy-production.firebaseapp.com",
  projectId: "bluboy-production",
  storageBucket: "bluboy-production.firebasestorage.app",
  messagingSenderId: "465992098232",
  appId: "1:465992098232:web:f82d21317ff60ef6aeef4d",
  measurementId: "G-TD4X356TS5"
};

export type Environment = 'test' | 'production';

let currentApp: FirebaseApp | null = null;
let currentAuth: Auth | null = null;
let currentAnalytics: Analytics | null = null;
let currentEnvironment: Environment = 'test';

export const initializeFirebase = (environment: Environment): { app: FirebaseApp; auth: Auth; analytics: Analytics | null } => {
  const config = environment === 'test' ? testFirebaseConfig : prodFirebaseConfig;
  
  // Initialize Firebase app
  currentApp = initializeApp(config, `app-${environment}`);
  currentAuth = getAuth(currentApp);
  
  // Initialize Analytics only in browser environment
  if (typeof window !== 'undefined') {
    currentAnalytics = getAnalytics(currentApp);
  }
  
  currentEnvironment = environment;
  
  return {
    app: currentApp,
    auth: currentAuth,
    analytics: currentAnalytics
  };
};

export const getCurrentFirebaseInstances = () => {
  if (!currentApp || !currentAuth) {
    throw new Error('Firebase not initialized. Call initializeFirebase first.');
  }
  
  return {
    app: currentApp,
    auth: currentAuth,
    analytics: currentAnalytics,
    environment: currentEnvironment
  };
};

export const getFirebaseConfig = (environment: Environment) => {
  return environment === 'test' ? testFirebaseConfig : prodFirebaseConfig;
};

