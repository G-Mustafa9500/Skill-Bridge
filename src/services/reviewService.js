// Reusable Firestore service for the `reviews` collection.
// Reviews target either a skill listing or a mentor's profile directly.
// Writing a review recalculates and stores the target's averageRating/rating
// so reads (marketplace cards, profile pages) never need to aggregate on the fly.

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';
import { updateSkillListing } from './skillService';
import { updateUserProfile } from './userService';
import { notifyUser } from './notificationService';

const REVIEWS_COLLECTION = 'reviews';

function validateReview({ rating, text }) {
  if (!rating || rating < 1 || rating > 5) return 'Rating must be between 1 and 5 stars.';
  if (text && text.length > 1000) return 'Review must be under 1000 characters.';
  return null;
}

async function recalculateSkillRating(skillId) {
  const q = query(collection(db, REVIEWS_COLLECTION), where('skillId', '==', skillId));
  const snap = await getDocs(q);
  const ratings = snap.docs.map((d) => d.data().rating);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  await updateSkillListing(skillId, { averageRating: Number(avg.toFixed(2)), totalReviews: ratings.length });
}

async function recalculateMentorRating(mentorId) {
  const q = query(collection(db, REVIEWS_COLLECTION), where('mentorId', '==', mentorId));
  const snap = await getDocs(q);
  const ratings = snap.docs.map((d) => d.data().rating);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  await updateUserProfile(mentorId, { rating: Number(avg.toFixed(2)) });
}

export async function createReview({ reviewerId, mentorId, skillId, skillTitle, rating, text }) {
  const validationError = validateReview({ rating, text });
  if (validationError) return { id: null, error: validationError };
  if (reviewerId === mentorId) return { id: null, error: "You can't review yourself." };

  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      reviewerId,
      mentorId,
      skillId,
      skillTitle,
      rating,
      text: (text || '').trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await Promise.all([recalculateSkillRating(skillId), recalculateMentorRating(mentorId)]);
    await notifyUser(mentorId, 'review', `You received a new ${rating}★ review for "${skillTitle}".`, { reviewId: docRef.id });
    return { id: docRef.id, error: null };
  } catch (err) {
    return { id: null, error: toFriendlyMessage(err) };
  }
}

export async function updateReview(id, { rating, text, skillId, mentorId }) {
  const validationError = validateReview({ rating, text });
  if (validationError) return { error: validationError };
  try {
    await updateDoc(doc(db, REVIEWS_COLLECTION, id), { rating, text: (text || '').trim(), updatedAt: serverTimestamp() });
    await Promise.all([recalculateSkillRating(skillId), recalculateMentorRating(mentorId)]);
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function deleteReview(id, { skillId, mentorId }) {
  try {
    await deleteDoc(doc(db, REVIEWS_COLLECTION, id));
    await Promise.all([recalculateSkillRating(skillId), recalculateMentorRating(mentorId)]);
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function getReviewsForSkill(skillId) {
  try {
    const q = query(collection(db, REVIEWS_COLLECTION), where('skillId', '==', skillId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[reviewService] getReviewsForSkill failed:', toFriendlyMessage(err));
    return [];
  }
}

export async function getReviewsForMentor(mentorId) {
  try {
    const q = query(collection(db, REVIEWS_COLLECTION), where('mentorId', '==', mentorId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[reviewService] getReviewsForMentor failed:', toFriendlyMessage(err));
    return [];
  }
}