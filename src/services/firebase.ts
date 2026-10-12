/**
 * @license
 * FCT ERP & CRM AUTOMOBILE - Service Central Firebase Client
 * Franchise Conseils Trading - Douala, Cameroun (Projet Firebase: fct-cmr)
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { UserProfile, UserRole } from '../../packages/shared-types/index.ts';

// Configuration client Firebase pour FCT Automobile (fct-cmr)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDOrL2WTMbKmo4P1f0n06x9trk6eWYokTM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fct-cmr.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fct-cmr',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fct-cmr.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '11946393528',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:11946393528:web:4169d263b70ea2c4b6d94d',
};

// Initialisation unique de l'application Firebase
export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth: Auth = getAuth(app);

// Initialisation Firestore avec cache local persistant (IndexedDB / Local Firebase)
function initFirestoreInstance(): Firestore {
  try {
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    }
  } catch (err) {
    console.info('Firestore déjà initialisé ou environnement spécifique, fallback getFirestore()');
  }
  return getFirestore(app);
}

export const db: Firestore = initFirestoreInstance();

// Types d'opérations et gestion des erreurs Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notification:', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Service d'authentification Firebase pour FCT
 */
export const authService = {
  async login(email: string, pass: string): Promise<FirebaseUser> {
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
    return cred.user;
  },

  async loginWithGoogle(): Promise<FirebaseUser> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async requestPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  },

  async authReady(): Promise<void> {
    if (typeof (auth as any).authStateReady === 'function') {
      await (auth as any).authStateReady();
    }
  },

  onAuthChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async fetchUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${uid}`);
    }
    return null;
  },

  async fetchUserProfileByEmail(email: string): Promise<UserProfile | null> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as UserProfile;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `users[email=${email}]`);
    }
    return null;
  },

  async syncUserProfile(profile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', profile.id), {
        ...profile,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${profile.id}`);
    }
  },
};
