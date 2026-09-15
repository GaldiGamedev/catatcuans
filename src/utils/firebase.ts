import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import {
  Wallet,
  Transaction,
  Category,
  AppSettings,
  Budget,
  SavingsGoal,
  QuickSpend,
  DebtRecord,
} from '../types';

export const firebaseConfig = firebaseConfigData;

// Initialize Firebase App
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth: Auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore (supporting named database if configured)
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Validate Firestore Connection (non-blocking)
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('Firestore is currently offline.');
    }
    return false;
  }
}

// User Financial Payload definition for Firestore Cloud Sync
export interface UserFinancialCloudData {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savings: SavingsGoal[];
  quickSpends: QuickSpend[];
  debts: DebtRecord[];
  settings?: Partial<AppSettings>;
  lastSyncedAt: number;
}

// Auth Actions
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName?.trim()) {
    await updateProfile(result.user, { displayName: displayName.trim() });
  }
  return result.user;
}

export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Cloud Data Sync Helpers
export async function saveUserCloudData(
  uid: string,
  data: UserFinancialCloudData
): Promise<void> {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        uid,
        email: auth.currentUser?.email || '',
        displayName: auth.currentUser?.displayName || '',
        photoURL: auth.currentUser?.photoURL || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    const financialsRef = doc(db, 'users', uid, 'financials', 'main');
    await setDoc(
      financialsRef,
      {
        ...data,
        lastSyncedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving user data to Firestore:', error);
    throw error;
  }
}

export async function loadUserCloudData(
  uid: string
): Promise<UserFinancialCloudData | null> {
  if (!uid) return null;
  try {
    const financialsRef = doc(db, 'users', uid, 'financials', 'main');
    const docSnap = await getDoc(financialsRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserFinancialCloudData;
    }
    return null;
  } catch (error) {
    console.error('Error loading user data from Firestore:', error);
    return null;
  }
}

export { onAuthStateChanged };
export type { User };
