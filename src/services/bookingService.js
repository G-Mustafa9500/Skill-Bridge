// Reusable Firestore service for the `bookings` and `sessions` collections.
// A booking is created once a learning request is accepted (or directly for
// free/instant-book listings); a session is the historical record once it happens.

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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';
import { notifyUser } from './notificationService';
import { updateUserProfile, getUserProfile } from './userService';

const BOOKINGS_COLLECTION = 'bookings';

function validateBooking({ date, time }) {
  if (!date) return 'Please select a date.';
  if (!time) return 'Please select a time.';
  const when = new Date(`${date}T${time}`);
  if (Number.isNaN(when.getTime())) return 'Invalid date/time.';
  if (when.getTime() < Date.now()) return 'Please pick a future date and time.';
  return null;
}

// status: 'upcoming' | 'completed' | 'cancelled'
export async function createBooking({ learnerId, mentorId, skillId, skillTitle, date, time, requestId = null }) {
  const validationError = validateBooking({ date, time });
  if (validationError) return { id: null, error: validationError };

  try {
    const scheduledAt = Timestamp.fromDate(new Date(`${date}T${time}`));
    const payload = {
      learnerId,
      mentorId,
      skillId,
      skillTitle,
      requestId,
      scheduledAt,
      status: 'upcoming',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), payload);
    await notifyUser(mentorId, 'booking_request', `New booking scheduled for "${skillTitle}".`, { bookingId: docRef.id });
    await notifyUser(learnerId, 'booking_approved', `Your session for "${skillTitle}" is booked! 📅`, { bookingId: docRef.id });
    return { id: docRef.id, error: null };
  } catch (err) {
    return { id: null, error: toFriendlyMessage(err) };
  }
}

export async function cancelBooking(bookingId) {
  try {
    const snap = await getDoc(doc(db, BOOKINGS_COLLECTION, bookingId));
    if (!snap.exists()) return { error: 'Booking not found.' };
    const data = snap.data();
    await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), { status: 'cancelled' });
    await notifyUser(data.learnerId, 'booking_cancelled', `Your session for "${data.skillTitle}" was cancelled.`, { bookingId });
    await notifyUser(data.mentorId, 'booking_cancelled', `A session for "${data.skillTitle}" was cancelled.`, { bookingId });
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

/** Marks a session complete and bumps both users' totalSessions counters. */
export async function completeBooking(bookingId) {
  try {
    const ref = doc(db, BOOKINGS_COLLECTION, bookingId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { error: 'Booking not found.' };
    const data = snap.data();
    await updateDoc(ref, { status: 'completed' });

    const [mentor, learner] = await Promise.all([getUserProfile(data.mentorId), getUserProfile(data.learnerId)]);
    if (mentor) await updateUserProfile(data.mentorId, { totalSessions: (mentor.totalSessions || 0) + 1 });
    if (learner) await updateUserProfile(data.learnerId, { totalSessions: (learner.totalSessions || 0) + 1 });

    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function getBookingsForUser(userId, role = 'learner') {
  try {
    const field = role === 'mentor' ? 'mentorId' : 'learnerId';
    const q = query(collection(db, BOOKINGS_COLLECTION), where(field, '==', userId), orderBy('scheduledAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[bookingService] getBookingsForUser failed:', toFriendlyMessage(err));
    return [];
  }
}