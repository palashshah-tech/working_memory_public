/* ============================================================
   Firebase Configuration & Initialization
   ============================================================ */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

/**
 * Environment Variables (VITE_ prefix is required)
 * These are pulled from your .env file locally 
 * or from Vercel Project Settings in production.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

if (!firebaseConfig.apiKey) {
  console.warn(
    "[Firebase] Warning: Firebase API key is not configured. " +
    "Please define VITE_FIREBASE_* environment variables in your deployment or local .env file."
  );
}

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Auth — sign in anonymously, silently, with no user interaction.
// Firebase reuses the same anonymous account on repeat visits (persisted in IndexedDB).
export const auth = getAuth(app);

/**
 * authReady resolves once we have a confirmed Firebase Auth UID.
 * All Firestore utility functions await this before hitting the server,
 * so security rules that check `request.auth != null` always pass.
 */
export const authReady = new Promise((resolve) => {
  // onAuthStateChanged fires immediately if a session is already cached,
  // so there is no noticeable delay for returning users.
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.warn('[Firebase] Anonymous sign-in failed:', e.code);
      }
    } else {
      unsub();        // stop listening once we have a user
      resolve(user);
    }
  });
});

/**
 * signInAsAdmin — called after the company code+password gate is passed.
 * Signs into Firebase with the admin's email/password so that Firestore rules
 * can verify `request.auth.token.email_verified == true`.
 * The email convention is: <companyId>@cogscreen.admin  (set up in Firebase Console).
 */
export async function signInAsAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutAdmin() {
  // After sign-out, fall back to anonymous so candidate ops still work
  await signOut(auth);
  await signInAnonymously(auth);
}
