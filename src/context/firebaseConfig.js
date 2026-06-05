import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

let app;
let isInitialized = false;

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
  } else {
    console.error("CRITICAL: Firebase configuration is missing! Check environment variables.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// Export db and auth with safety checks
export const db = isInitialized ? getFirestore(app) : null;
export const auth = isInitialized ? getAuth(app) : null;
