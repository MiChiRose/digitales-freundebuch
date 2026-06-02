import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA701EHLE4urYA0Qmr-C6mcAHDXXzxb6rI",
  authDomain: "digitales-freundebuch.firebaseapp.com",
  projectId: "digitales-freundebuch",
  storageBucket: "digitales-freundebuch.firebasestorage.app",
  messagingSenderId: "891826792087",
  appId: "1:891826792087:web:42def0c9625e3610d82bd2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
