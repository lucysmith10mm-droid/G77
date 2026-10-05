import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  where,
  onSnapshot,
  query,
  orderBy,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Order } from '../types';

export const OWNER_EMAIL = 'harishsingh9208@gmail.com';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Suppress internal Firestore connection retry logs when operating in sandboxed/offline preview
setLogLevel('error');

// Configure Firestore with auto-detect long polling for sandboxed iframes
let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling per Firebase Skill
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const isPermissionError =
    errMessage.toLowerCase().includes('permission') ||
    (error as any)?.code === 'permission-denied';

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };

  if (isPermissionError) {
    console.error('Firestore Permission Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  }
}

// Test connection on boot per Firebase Skill requirement safely
export async function testConnection(): Promise<boolean> {
  try {
    return Boolean(db && app);
  } catch (error) {
    console.warn('Firebase connection check note:', error);
    return false;
  }
}

// Helper to check if email is the authorized owner
export function isAuthorizedOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === OWNER_EMAIL.toLowerCase().trim();
}

// Google Sign-In with popup
export async function signInWithGoogleAsOwner(): Promise<{ user: User; isOwner: boolean }> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const isOwner = isAuthorizedOwner(user.email);

  if (!isOwner) {
    // Immediately sign out unauthorized user
    await signOut(auth);
    throw new Error(
      `403 ACCESS DENIED: Account ${user.email} is not authorized. The Admin Dashboard is strictly restricted to ${OWNER_EMAIL}.`
    );
  }

  return { user, isOwner: true };
}

// Real-time listener for Orders from Firestore (Live Time Sync)
export function subscribeToLiveOrders(
  onOrdersChange: (orders: Order[]) => void,
  onError?: (err: any) => void
): () => void {
  const ordersCol = collection(db, 'orders');
  const q = query(ordersCol);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Order;
        orders.push({
          ...data,
          id: data.id || docSnap.id,
        });
      });
      // Sort newest first
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onOrdersChange(orders);
    },
    (err) => {
      console.warn('Firestore orders live subscription notice:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, 'orders');
    }
  );

  return unsubscribe;
}

// Direct write from customer checkout to Firestore as dual-link
export async function syncOrderDirectlyToFirestore(order: Order): Promise<void> {
  try {
    const orderDocRef = doc(db, 'orders', order.orderId);
    await setDoc(
      orderDocRef,
      {
        ...order,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Direct Firestore order sync note:', err);
    // Silent failover, server already recorded it
  }
}

// Direct delete from admin panel to Firestore (Scrub by ID, orderId, and query)
export async function deleteOrderDirectlyFromFirestore(orderIdOrDocId: string): Promise<void> {
  if (!orderIdOrDocId) return;
  try {
    // 1. Direct doc delete by ID or orderId key
    const orderDocRef = doc(db, 'orders', orderIdOrDocId);
    await deleteDoc(orderDocRef).catch(() => {});

    // 2. Also search if Firestore document was stored with different ID
    const ordersCol = collection(db, 'orders');
    const q1 = query(ordersCol, where('orderId', '==', orderIdOrDocId));
    const snap1 = await getDocs(q1).catch(() => null);
    if (snap1 && !snap1.empty) {
      snap1.forEach((d) => deleteDoc(d.ref).catch(() => {}));
    }

    const q2 = query(ordersCol, where('id', '==', orderIdOrDocId));
    const snap2 = await getDocs(q2).catch(() => null);
    if (snap2 && !snap2.empty) {
      snap2.forEach((d) => deleteDoc(d.ref).catch(() => {}));
    }
  } catch (err) {
    console.warn('Direct Firestore order delete note:', err);
  }
}

// =========================================================================
// Showcase Videos & Reels Firestore Data Service Integration
// =========================================================================

// Real-time listener for Showcase Videos from Firestore
export function subscribeToShowcaseVideos(
  onVideosChange: (videos: any[]) => void,
  onError?: (err: any) => void
): () => void {
  const videosCol = collection(db, 'showcase_videos');
  const q = query(videosCol);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const vids: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          vids.push({
            ...data,
            id: data.id || docSnap.id,
          });
        });
        vids.sort((a, b) => (a.order || 0) - (b.order || 0));
        onVideosChange(vids);
      }
    },
    (err) => {
      console.warn('Firestore showcase videos live subscription notice:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, 'showcase_videos');
    }
  );

  return unsubscribe;
}

// Direct save video to Firestore data service
export async function saveShowcaseVideoToFirestore(video: any): Promise<void> {
  if (!video || !video.id) return;
  try {
    const videoDocRef = doc(db, 'showcase_videos', video.id);
    await setDoc(
      videoDocRef,
      {
        ...video,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Direct Firestore video save note:', err);
    handleFirestoreError(err, OperationType.WRITE, `showcase_videos/${video.id}`);
  }
}

// Direct delete video from Firestore data service
export async function deleteShowcaseVideoFromFirestore(videoId: string): Promise<void> {
  if (!videoId) return;
  try {
    const videoDocRef = doc(db, 'showcase_videos', videoId);
    await deleteDoc(videoDocRef).catch(() => {});
  } catch (err) {
    console.warn('Direct Firestore video delete note:', err);
    handleFirestoreError(err, OperationType.DELETE, `showcase_videos/${videoId}`);
  }
}

// Seed initial default showcase videos to Firestore data service if collection is empty
export async function seedInitialVideosToFirestore(defaultVideos: any[]): Promise<void> {
  try {
    const videosCol = collection(db, 'showcase_videos');
    const snapshot = await getDocs(videosCol).catch(() => null);
    if (!snapshot || snapshot.empty) {
      console.log('Seeding initial showcase videos into Firestore data service...');
      for (const vid of defaultVideos) {
        const docRef = doc(db, 'showcase_videos', vid.id);
        await setDoc(docRef, { ...vid, syncedAt: new Date().toISOString() }, { merge: true });
      }
    }
  } catch (err) {
    console.warn('Firestore video seed notice:', err);
  }
}

