import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { Order, QRData } from '../src/types';

// Load Firebase config
let config: any = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (err) {
  console.warn('[Firebase] Config file read note:', err);
}

const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];

// Initialize Firestore with specific database ID if configured
export const firestoreDb = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

// Sync Order to Firestore Cloud Database
export async function syncOrderToFirestore(order: Order): Promise<void> {
  try {
    const orderDocRef = doc(firestoreDb, 'orders', order.orderId);
    await setDoc(
      orderDocRef,
      {
        ...order,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[Firebase Cloud] Order ${order.orderId} synced to Firestore.`);
  } catch (err: any) {
    console.warn(`[Firebase Cloud] Order sync notice (${order.orderId}):`, err?.message || err);
  }
}

// Sync Active QR Config to Firestore
export async function syncQRToFirestore(qr: QRData): Promise<void> {
  try {
    const qrDocRef = doc(firestoreDb, 'system', 'qr_config');
    await setDoc(
      qrDocRef,
      {
        ...qr,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[Firebase Cloud] QR config synced to Firestore.`);
  } catch (err: any) {
    console.warn(`[Firebase Cloud] QR sync notice:`, err?.message || err);
  }
}

// Sync Audit Log to Firestore
export async function syncAuditLogToFirestore(log: any): Promise<void> {
  try {
    const logDocRef = doc(firestoreDb, 'audit_logs', log.auditLogId);
    await setDoc(
      logDocRef,
      {
        ...log,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn(`[Firebase Cloud] Audit sync notice:`, err?.message || err);
  }
}

// Delete Order from Firestore Cloud Database (Trash / Purge)
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  try {
    const orderDocRef = doc(firestoreDb, 'orders', orderId);
    await deleteDoc(orderDocRef);
    console.log(`[Firebase Cloud] Order ${orderId} permanently deleted from Firestore.`);
  } catch (err: any) {
    console.warn(`[Firebase Cloud] Order delete notice (${orderId}):`, err?.message || err);
  }
}

// Purge all orders from Firestore Cloud Database
export async function purgeAllOrdersFromFirestore(): Promise<number> {
  try {
    const ordersCol = collection(firestoreDb, 'orders');
    const snap = await getDocs(ordersCol);
    let count = 0;
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
      count++;
    }
    console.log(`[Firebase Cloud] Purged ${count} documents from orders collection.`);
    return count;
  } catch (err: any) {
    console.warn(`[Firebase Cloud] Purge all orders notice:`, err?.message || err);
    return 0;
  }
}

// Sync Showcase Video to Firestore Cloud Database
export async function syncVideoToFirestore(video: any): Promise<void> {
  try {
    const videoDocRef = doc(firestoreDb, 'showcase_videos', video.id);
    await setDoc(
      videoDocRef,
      {
        ...video,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[Firebase Cloud] Showcase video ${video.id} synced to Firestore.`);
  } catch (err: any) {
    console.warn(`[Firebase Cloud] Video sync notice (${video.id}):`, err?.message || err);
  }
}

// Delete Showcase Video from Firestore
export async function deleteVideoFromFirestore(videoId: string): Promise<void> {
  try {
    const videoDocRef = doc(firestoreDb, 'showcase_videos', videoId);
    await deleteDoc(videoDocRef);
    console.log(`[Firebase Cloud] Video ${videoId} deleted from Firestore.`);
  } catch (err: any) {
    console.warn(`[Firebase Cloud] Video delete notice (${videoId}):`, err?.message || err);
  }
}

// Seed Showcase Videos into Firestore if empty
export async function seedVideosToFirestore(videos: any[]): Promise<void> {
  try {
    const videosCol = collection(firestoreDb, 'showcase_videos');
    const snap = await getDocs(videosCol).catch(() => null);
    if (!snap || snap.empty) {
      console.log('[Firebase Cloud] Seeding showcase videos into Firestore cloud database...');
      for (const v of videos) {
        const docRef = doc(firestoreDb, 'showcase_videos', v.id);
        await setDoc(docRef, { ...v, syncedAt: new Date().toISOString() }, { merge: true });
      }
    }
  } catch (err: any) {
    console.warn('[Firebase Cloud] Video seed notice:', err?.message || err);
  }
}


