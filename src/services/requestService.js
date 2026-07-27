// Reusable Firestore service for the `requests` collection — learning requests
// a learner sends to a mentor (distinct from open community "help" posts).

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';
import { notifyUser } from './notificationService';

const REQUESTS_COLLECTION = 'requests';

// status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
export async function sendLearningRequest({ learnerId, mentorId, skillId, skillTitle, message }) {
  if (learnerId === mentorId) return { id: null, error: "You can't send a request to yourself." };
  try {
    const payload = {
      learnerId,
      mentorId,
      skillId,
      skillTitle,
      message: (message || '').trim(),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), payload);
    await notifyUser(mentorId, 'booking_request', `New learning request for "${skillTitle}".`, { requestId: docRef.id });
    return { id: docRef.id, error: null };
  } catch (err) {
    return { id: null, error: toFriendlyMessage(err) };
  }
}

async function setStatus(requestId, status, notifyTargetField, notifyText) {
  try {
    const snap = await getDoc(doc(db, REQUESTS_COLLECTION, requestId));
    if (!snap.exists()) return { error: 'Request not found.' };
    const data = snap.data();
    await updateDoc(doc(db, REQUESTS_COLLECTION, requestId), { status, updatedAt: serverTimestamp() });
    if (notifyTargetField) {
      await notifyUser(data[notifyTargetField], 'booking_approved', notifyText, { requestId });
    }
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export function acceptRequest(requestId, skillTitle) {
  return setStatus(requestId, 'accepted', 'learnerId', `Your request for "${skillTitle}" was accepted! 🎉`);
}
export function rejectRequest(requestId, skillTitle) {
  return setStatus(requestId, 'rejected', 'learnerId', `Your request for "${skillTitle}" was declined.`);
}
export function cancelRequest(requestId, skillTitle) {
  return setStatus(requestId, 'cancelled', 'mentorId', `A learning request for "${skillTitle}" was cancelled.`);
}
export function completeRequest(requestId, skillTitle) {
  return setStatus(requestId, 'completed', 'mentorId', `"${skillTitle}" was marked complete.`);
}

export async function getRequestsForUser(userId, role = 'learner') {
  try {
    const field = role === 'mentor' ? 'mentorId' : 'learnerId';
    const q = query(collection(db, REQUESTS_COLLECTION), where(field, '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[requestService] getRequestsForUser failed:', toFriendlyMessage(err));
    return [];
  }
}