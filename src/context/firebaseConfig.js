import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyA701EHLE4urYA0Qmr-C6mcAHDXXzxb6rI',
  authDomain: 'digitales-freundebuch.firebaseapp.com',
  projectId: 'digitales-freundebuch',
  storageBucket: 'digitales-freundebuch.firebasestorage.app',
  messagingSenderId: '891826792087',
  appId: '1:891826792087:web:42def0c9625e3610d82bd2'
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

