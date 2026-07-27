// Lightweight presence system built on Firestore (no Realtime Database needed).
// A heartbeat updates `lastSeen` every 30s while the tab is open; a user is
// considered "online" if their lastSeen is within the last 60 seconds.

import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const ONLINE_THRESHOLD_MS = 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

/** Call once per app session (e.g. inside a top-level effect) while a user is logged in. */
export function startPresenceHeartbeat(uid) {
  if (!uid) return () => {};
  const ref = doc(db, 'users', uid);
  const beat = () => updateDoc(ref, { lastSeen: serverTimestamp() }).catch(() => {});
  beat();
  const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS);
  return () => clearInterval(interval);
}

/** Subscribes to another user's presence; callback receives { isOnline, lastSeen }. */
export function subscribeToPresence(uid, callback) {
  const ref = doc(db, 'users', uid);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return callback({ isOnline: false, lastSeen: null });
    const data = snap.data();
    const lastSeen = data.lastSeen?.toDate ? data.lastSeen.toDate() : null;
    const isOnline = lastSeen ? Date.now() - lastSeen.getTime() < ONLINE_THRESHOLD_MS : false;
    callback({ isOnline, lastSeen });
  });
}