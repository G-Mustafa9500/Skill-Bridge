// Reusable Firestore service for the `notifications` collection.
// Every feature that needs to notify a user (bookings, messages, reviews, AI, admin
// broadcasts) should call notifyUser() instead of writing to Firestore directly.

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as fsLimit,
  onSnapshot,
  writeBatch,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';

const NOTIFICATIONS_COLLECTION = 'notifications';

// type: 'booking_request' | 'booking_approved' | 'booking_cancelled' | 'message' |
//       'review' | 'ai_recommendation' | 'admin_announcement'
export async function notifyUser(userId, type, text, meta = {}) {
  try {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      type,
      text,
      meta,
      read: false,
      createdAt: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    // Notifications are best-effort — never let a failed notification block the
    // primary action (e.g. a booking should still succeed even if the notify fails).
    console.error('[notificationService] notifyUser failed:', toFriendlyMessage(err));
    return { error: toFriendlyMessage(err) };
  }
}

/** Broadcasts the same notification to many users at once (e.g. admin announcements). */
export async function broadcastNotification(userIds, text, meta = {}) {
  try {
    const batch = writeBatch(db);
    userIds.forEach((uid) => {
      const ref = doc(collection(db, NOTIFICATIONS_COLLECTION));
      batch.set(ref, { userId: uid, type: 'admin_announcement', text, meta, read: false, createdAt: serverTimestamp() });
    });
    await batch.commit();
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

/**
 * Subscribes to a user's notifications in real time. Returns the unsubscribe fn.
 * Always call it in a useEffect cleanup.
 */
export function subscribeToNotifications(userId, callback) {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    fsLimit(50)
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })), null),
    (err) => callback([], toFriendlyMessage(err))
  );
}

export async function markNotificationRead(id) {
  try {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), { read: true });
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function markAllNotificationsRead(userId) {
  try {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('userId', '==', userId), where('read', '==', false));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function deleteNotification(id) {
  try {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, id));
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}