import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId according to project guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on boot
export async function ensureAuth(): Promise<boolean> {
  if (auth.currentUser) return true;
  try {
    await signInAnonymously(auth);
    return true;
  } catch (authErr) {
    console.warn('Anonymous auth note (proceeding):', authErr);
    return false;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await ensureAuth();
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
      return false;
    }
    // If document doesn't exist but server responded, connection is working
    return true;
  }
}

// Recursively remove undefined values so Firestore setDoc never rejects the payload
export function sanitizeForFirestore<T>(data: T): any {
  if (data === null || data === undefined) {
    return null;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item));
  }
  if (typeof data === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj;
  }
  return data;
}

// Firestore Collection Helpers
export async function fetchCollectionOnce<T extends { id: string }>(collectionName: string): Promise<T[]> {
  try {
    await ensureAuth();
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as T[];
  } catch (error) {
    console.warn(`Firestore read note on ${collectionName}:`, error);
    return [];
  }
}

export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onData: (data: T[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    ensureAuth().catch(() => {});
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map((docSnap) => {
          const docData = docSnap.data();
          return {
            id: docSnap.id,
            ...docData,
          } as T;
        });
        onData(items);
      },
      (error) => {
        console.warn(`Firestore subscription note on ${collectionName}:`, error);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    console.warn(`Firestore subscribe exception on ${collectionName}:`, error);
    if (onError && error instanceof Error) onError(error);
    return () => {};
  }
}

export async function saveDocToFirestore<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<boolean> {
  if (!item || !item.id) {
    console.warn(`saveDocToFirestore skipped: missing id on collection ${collectionName}`, item);
    return false;
  }
  const docPath = `${collectionName}/${item.id}`;
  try {
    await ensureAuth();
    const cleanItem = sanitizeForFirestore(item);
    const docRef = doc(db, collectionName, String(item.id));
    await setDoc(docRef, cleanItem, { merge: true });
    return true;
  } catch (error) {
    console.warn(`Firestore save note on ${docPath}:`, error);
    return false;
  }
}

export async function deleteDocFromFirestore(collectionName: string, id: string): Promise<boolean> {
  if (!id) return false;
  const docPath = `${collectionName}/${id}`;
  try {
    await ensureAuth();
    const docRef = doc(db, collectionName, String(id));
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.warn(`Firestore delete note on ${docPath}:`, error);
    return false;
  }
}

export async function clearFirestoreCollection(collectionName: string): Promise<number> {
  try {
    await ensureAuth();
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return 0;

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    return snapshot.size;
  } catch (error) {
    console.warn(`Firestore clear error on ${collectionName}:`, error);
    return 0;
  }
}

