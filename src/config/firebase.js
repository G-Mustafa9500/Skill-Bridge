// Firebase initialization for SkillBridge.
// All config values come from environment variables (.env) — never hardcoded here.
// This keeps secrets out of source control and lets us swap projects per-environment.

import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Fail loudly in dev if required env vars are missing, so mis-configuration
// is caught immediately instead of surfacing as a confusing runtime error later.
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
const missing = requiredKeys.filter((key) => !firebaseConfig[key]);
if (missing.length > 0) {
  console.error(
    `[firebase] Missing required env vars: ${missing
      .map((k) => `VITE_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`)
      .join(', ')}. Check your .env file.`
  ); // eslint-disable-line no-console
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics only works in a browser context that supports it (not SSR, not all
// privacy-restricted browsers), so we guard it instead of calling getAnalytics directly.
export let analytics = null;
analyticsIsSupported()
  .then((supported) => {
    if (supported) analytics = getAnalytics(app);
  })
  .catch(() => {
    // Analytics unsupported in this environment — safe to ignore.
  });
