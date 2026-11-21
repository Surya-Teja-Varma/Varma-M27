import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
  type Analytics,
} from "firebase/analytics";
import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

/**
 * Public Firebase Web App config for project `varma-27`.
 * Environment variables (`VITE_FIREBASE_*`) take precedence when configured on Vercel / local `.env.local`.
 * Firebase Web API config values are public client identifiers — data access is protected by
 * Firebase Authentication + owner-only Firestore Security Rules (`firestore.rules`).
 */
const DEFAULT_FIREBASE_CONFIG: FirebaseOptions = {
  apiKey: "AIzaSyAKuV-rY1jWnvzwPHzPcOxEXCr56Br3QpU",
  authDomain: "varma-27.firebaseapp.com",
  projectId: "varma-27",
  storageBucket: "varma-27.firebasestorage.app",
  messagingSenderId: "933092445043",
  appId: "1:933092445043:web:396e6b0b408a604290d306",
  measurementId: "G-DDFJTFE08W",
};

const env = import.meta.env;
const measurementId = env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId;

const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId || "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket || "",
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId || "",
  appId: env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId || "",
  ...(measurementId ? { measurementId } : {}),
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
  );
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let analyticsInitStarted = false;
let cachedAnalytics: Analytics | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return null;
  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return cachedApp;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!cachedAuth) {
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!cachedDb) {
    try {
      cachedDb = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      cachedDb = getFirestore(app);
    }
  }
  return cachedDb;
}

export function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined" || !firebaseConfig.measurementId) {
    return Promise.resolve(null);
  }
  if (cachedAnalytics) return Promise.resolve(cachedAnalytics);
  if (analyticsInitStarted) return Promise.resolve(null);
  analyticsInitStarted = true;
  const app = getFirebaseApp();
  if (!app) return Promise.resolve(null);
  return isAnalyticsSupported()
    .then((ok) => {
      if (!ok) return null;
      cachedAnalytics = getAnalytics(app);
      return cachedAnalytics;
    })
    .catch(() => null);
}

export function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
