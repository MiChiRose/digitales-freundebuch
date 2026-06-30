import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, memoryLocalCache } from 'firebase/firestore';
import * as FirebaseAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

let app;
let authInstance = null;
let dbInstance = null;
let isInitialized = false;

const getAuthPersistence = () => {
  if (typeof FirebaseAuth.getReactNativePersistence === 'function') {
    return FirebaseAuth.getReactNativePersistence(AsyncStorage);
  }

  return FirebaseAuth.inMemoryPersistence;
};

try {
  // Check if at least the essential keys are present
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      isInitialized = true;
    } else {
      app = getApp();
      isInitialized = true;
    }

    try {
      authInstance = FirebaseAuth.initializeAuth(app, {
        persistence: getAuthPersistence(),
      });
    } catch (error) {
      authInstance = FirebaseAuth.getAuth(app);
    }

    try {
      dbInstance = initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true,
      });
    } catch (error) {
      dbInstance = getFirestore(app);
    }
  } else {
    console.error("CRITICAL: Firebase configuration is missing! Check environment variables.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// Export db and auth with safety checks
export const db = isInitialized ? dbInstance : null;
export const auth = isInitialized ? authInstance : null;
