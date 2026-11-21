import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";

import {
  createGoogleProvider,
  getFirebaseAuth,
  getFirebaseDb,
  initFirebaseAnalytics,
} from "./firebase";
import { APP_TIMEZONE, sanitizeState, type MissionState } from "./progress";

export interface CloudUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export function toCloudUser(u: User): CloudUser {
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Recursively strips `undefined` properties from plain objects & arrays because Firestore rejects
 * explicit `undefined` values, while leaving class instances (like `serverTimestamp()`) untouched.
 */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

export function describeFirebaseError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const host = typeof window !== "undefined" ? window.location.hostname : "this domain";
  switch (code) {
    case "permission-denied":
      return "Firestore permission denied. Check your sign-in status and Firestore security rules.";
    case "unavailable":
      return "Cloud sync is temporarily offline. Changes are cached locally and will retry.";
    case "auth/popup-closed-by-user":
      return "Sign-in window was closed before completing.";
    case "auth/cancelled-popup-request":
      return "Another sign-in popup is already open.";
    case "auth/network-request-failed":
      return "Network error while contacting Firebase. Check your connection.";
    case "auth/unauthorized-domain":
      return `Add "${host}" under Firebase Console → Authentication → Settings → Authorized domains.`;
    default:
      return error instanceof Error ? error.message : "Could not sync with Firebase.";
  }
}

const missionDocRef = (uid: string) => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore is not configured.");
  return doc(db, "users", uid, "mission", "state");
};

const profileDocRef = (uid: string) => {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase Firestore is not configured.");
  return doc(db, "users", uid, "profile", "meta");
};

export async function signInGoogleAccount(): Promise<CloudUser | null> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Authentication is not configured.");
  const provider = createGoogleProvider();
  try {
    const res = await signInWithPopup(auth, provider);
    return toCloudUser(res.user);
  } catch (err) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: unknown }).code)
        : "";
    if (
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw err;
  }
}

export async function signOutAccount(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function subscribeAuth(cb: (user: CloudUser | null) => void): Unsubscribe {
  const auth = getFirebaseAuth();
  if (!auth) {
    cb(null);
    return () => {};
  }
  void initFirebaseAnalytics();
  void getRedirectResult(auth).catch(() => {
    /* handled via auth state observer */
  });
  return onAuthStateChanged(auth, (u) => {
    cb(u ? toCloudUser(u) : null);
  });
}

export async function upsertUserProfile(user: CloudUser): Promise<void> {
  const ref = profileDocRef(user.uid);
  await setDoc(
    ref,
    {
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
      timezone: APP_TIMEZONE,
      lastLoginAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function fetchCloudMissionState(uid: string): Promise<MissionState | null> {
  const snap = await getDoc(missionDocRef(uid));
  if (!snap.exists()) return null;
  return sanitizeState(snap.data());
}

export async function saveCloudMissionState(uid: string, state: MissionState): Promise<void> {
  const cleanState = stripUndefined(sanitizeState(state));
  await setDoc(missionDocRef(uid), {
    ...cleanState,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeCloudMissionState(
  uid: string,
  onRemoteData: (state: MissionState | null, fromCache: boolean) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    missionDocRef(uid),
    (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (!snap.exists()) {
        onRemoteData(null, snap.metadata.fromCache);
        return;
      }
      onRemoteData(sanitizeState(snap.data()), snap.metadata.fromCache);
    },
    (err) => onError(err),
  );
}
