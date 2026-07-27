// Reusable Firestore service for the `favorites` collection.
// Doc id is deterministic (`{userId}_{targetType}_{targetId}`) so toggling a
// favorite is a simple exists-check + set/delete, no query needed.

import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';

const FAVORITES_COLLECTION = 'favorites';

function favoriteId(userId, targetType, targetId) {
  return `${userId}_${targetType}_${targetId}`;
}

export async function isFavorited(userId, targetType, targetId) {
  try {
    const snap = await getDoc(doc(db, FAVORITES_COLLECTION, favoriteId(userId, targetType, targetId)));
    return snap.exists();
  } catch (err) {
    console.error('[favoriteService] isFavorited failed:', toFriendlyMessage(err));
    return false;
  }
}

/** Toggles a favorite on/off and returns the new state. */
export async function toggleFavorite(userId, targetType, targetId) {
  const id = favoriteId(userId, targetType, targetId);
  try {
    const ref = doc(db, FAVORITES_COLLECTION, id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await deleteDoc(ref);
      return { isFavorited: false, error: null };
    }
    await setDoc(ref, { userId, targetType, targetId, createdAt: serverTimestamp() });
    return { isFavorited: true, error: null };
  } catch (err) {
    return { isFavorited: false, error: toFriendlyMessage(err) };
  }
}

export async function getFavorites(userId, targetType) {
  try {
    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where('userId', '==', userId),
      where('targetType', '==', targetType)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data().targetId);
  } catch (err) {
    console.error('[favoriteService] getFavorites failed:', toFriendlyMessage(err));
    return [];
  }
}