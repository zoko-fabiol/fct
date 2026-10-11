/**
 * @license
 * FCT Public Website - Connexion Firebase Client (Firestore & Auth)
 * Franchise Conseils Trading - Douala, Cameroun (Projet: fct-cmr)
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDOrL2WTMbKmo4P1f0n06x9trk6eWYokTM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fct-cmr.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fct-cmr',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fct-cmr.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '11946393528',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:11946393528:web:4169d263b70ea2c4b6d94d',
};

export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
};
export type { FirebaseUser };
