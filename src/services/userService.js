// Reusable Firestore service for the `users` collection.
// Every user document follows the profile schema from the SkillBridge spec.
// All reads/writes go through here so validation + error handling stay in one place.

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';

const USERS_COLLECTION = 'users';

// Default shape for a new profile — keeps every user doc consistent even if
// the caller only supplies a few fields (e.g. on signup).
function defaultProfile(uid, overrides = {}) {
  return {
    uid,
    fullName: '',
    username: '',
    email: '',
    profilePicture: '',
    coverImage: '',
    bio: '',
    skills: [],
    experienceLevel: 'beginner', // beginner | intermediate | advanced | expert
    country: '',
    city: '',
    languages: [],
    socialLinks: {},
    portfolioWebsite: '',
    availabilityStatus: 'available', // available | busy | offline
    rating: 0,
    totalSessions: 0,
    isAdmin: false,
    emailVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function validateProfileInput(data) {
  const errors = {};
  if (data.fullName !== undefined && !data.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }
  if (data.bio !== undefined && data.bio.length > 500) {
    errors.bio = 'Bio must be under 500 characters.';
  }
  if (data.skills !== undefined && !Array.isArray(data.skills)) {
    errors.skills = 'Skills must be a list.';
  }
  return errors;
}

export async function createUserProfile(uid, data) {
  try {
    const errors = validateProfileInput(data);
    if (Object.keys(errors).length) return { error: Object.values(errors)[0], data: null };

    const profile = defaultProfile(uid, data);
    await setDoc(doc(db, USERS_COLLECTION, uid), profile);
    return { data: profile, error: null };
  } catch (err) {
    return { data: null, error: toFriendlyMessage(err) };
  }
}

export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    // Read failures degrade to "not found" from the caller's perspective;
    // callers that need to distinguish should catch upstream instead.
    console.error('[userService] getUserProfile failed:', toFriendlyMessage(err));
    return null;
  }
}

export async function updateUserProfile(uid, updates) {
  try {
    const errors = validateProfileInput(updates);
    if (Object.keys(errors).length) return { error: Object.values(errors)[0] };

    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function deleteUserProfile(uid) {
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function isUsernameTaken(username) {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('username', '==', username), limit(1));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.error('[userService] isUsernameTaken failed:', toFriendlyMessage(err));
    return false;
  }
}
