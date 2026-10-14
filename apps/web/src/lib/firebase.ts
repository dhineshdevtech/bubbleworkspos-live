import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.NEXT_PUBLIC_FIREBASE_API_KEY) as string,
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) as string,
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) as string,
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) as string,
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) as string,
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_APP_ID) as string,
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || import.meta.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) as string,
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
