// Reusable Firestore service for the `skills` collection (marketplace listings).

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
  limit as fsLimit,
  startAfter,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';

const SKILLS_COLLECTION = 'skills';
const PAGE_SIZE = 12;

function validateListing(data) {
  const errors = {};
  if (!data.title || !data.title.trim()) errors.title = 'Title is required.';
  if (!data.description || !data.description.trim()) errors.description = 'Description is required.';
  if (!data.categoryId) errors.categoryId = 'Category is required.';
  if (!data.level) errors.level = 'Skill level is required.';
  if (data.isFree === false && (data.price === undefined || data.price === null || data.price < 0)) {
    errors.price = 'Set a valid price, or mark this listing as free.';
  }
  if (data.durationMinutes !== undefined && data.durationMinutes <= 0) {
    errors.durationMinutes = 'Duration must be greater than 0.';
  }
  return errors;
}

/** Creates a new skill listing owned by `mentorId`. */
export async function createSkillListing(mentorId, data) {
  const errors = validateListing(data);
  if (Object.keys(errors).length) return { id: null, error: Object.values(errors)[0] };

  try {
    const payload = {
      mentorId,
      title: data.title.trim(),
      description: data.description.trim(),
      categoryId: data.categoryId,
      level: data.level, // beginner | intermediate | advanced
      isFree: !!data.isFree,
      price: data.isFree ? 0 : Number(data.price),
      durationMinutes: data.durationMinutes || 60,
      mode: data.mode || 'online', // online | offline
      images: data.images || [],
      availability: data.availability || [], // array of { day, startTime, endTime }
      tags: data.tags || [],
      status: 'active', // active | paused | deleted
      averageRating: 0,
      totalReviews: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, SKILLS_COLLECTION), payload);
    return { id: docRef.id, error: null };
  } catch (err) {
    return { id: null, error: toFriendlyMessage(err) };
  }
}

export async function updateSkillListing(id, updates) {
  const errors = validateListing({ ...updates, title: updates.title || 'x', description: updates.description || 'x', categoryId: updates.categoryId || 'x', level: updates.level || 'x' });
  // Only block on fields actually being changed to a bad value — allow partial updates.
  const relevantErrors = Object.fromEntries(Object.entries(errors).filter(([k]) => k in updates));
  if (Object.keys(relevantErrors).length) return { error: Object.values(relevantErrors)[0] };

  try {
    await updateDoc(doc(db, SKILLS_COLLECTION, id), { ...updates, updatedAt: serverTimestamp() });
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

/** Soft delete — keeps historical bookings/reviews referencing this listing intact. */
export async function deleteSkillListing(id) {
  try {
    await updateDoc(doc(db, SKILLS_COLLECTION, id), { status: 'deleted', updatedAt: serverTimestamp() });
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function getSkillListing(id) {
  try {
    const snap = await getDoc(doc(db, SKILLS_COLLECTION, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error('[skillService] getSkillListing failed:', toFriendlyMessage(err));
    return null;
  }
}

export async function getSkillsByMentor(mentorId) {
  try {
    const q = query(
      collection(db, SKILLS_COLLECTION),
      where('mentorId', '==', mentorId),
      where('status', '!=', 'deleted')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[skillService] getSkillsByMentor failed:', toFriendlyMessage(err));
    return [];
  }
}

/**
 * Paginated marketplace browse with optional category/level filters.
 * Firestore composite indexes are required for status+category+createdAt combos —
 * see firestore.indexes.json.
 */
export async function browseSkills({ categoryId, level, cursor } = {}) {
  try {
    const clauses = [where('status', '==', 'active')];
    if (categoryId) clauses.push(where('categoryId', '==', categoryId));
    if (level) clauses.push(where('level', '==', level));

    let q = query(collection(db, SKILLS_COLLECTION), ...clauses, orderBy('createdAt', 'desc'), fsLimit(PAGE_SIZE));
    if (cursor) q = query(collection(db, SKILLS_COLLECTION), ...clauses, orderBy('createdAt', 'desc'), startAfter(cursor), fsLimit(PAGE_SIZE));

    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const nextCursor = snap.docs.length === PAGE_SIZE ? snap.docs[snap.docs.length - 1] : null;
    return { items, nextCursor, error: null };
  } catch (err) {
    return { items: [], nextCursor: null, error: toFriendlyMessage(err) };
  }
}
