// Reusable authentication service.
// Wraps Firebase Auth so components never call firebase/auth directly —
// this keeps auth logic testable, centralized, and easy to swap later.

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';
import { createUserProfile, getUserProfile } from './userService';

const googleProvider = new GoogleAuthProvider();

/**
 * Registers a new user with email/password, sets their display name,
 * creates their Firestore profile document, and sends a verification email.
 */
export async function registerWithEmail({ name, email, password }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await createUserProfile(cred.user.uid, {
      fullName: name,
      email: cred.user.email,
      emailVerified: false,
    });
    await sendEmailVerification(cred.user);
    return { user: cred.user, error: null };
  } catch (err) {
    return { user: null, error: toFriendlyMessage(err) };
  }
}

export async function loginWithEmail({ email, password }) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { user: cred.user, error: null };
  } catch (err) {
    return { user: null, error: toFriendlyMessage(err) };
  }
}

/**
 * Google Sign-In via popup. Handles both new users (auto-creates a profile)
 * and existing users (just fetches their profile) transparently.
 */
export async function loginWithGoogle() {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const existingProfile = await getUserProfile(cred.user.uid);
    if (!existingProfile) {
      await createUserProfile(cred.user.uid, {
        fullName: cred.user.displayName || 'New User',
        email: cred.user.email,
        profilePicture: cred.user.photoURL || '',
        emailVerified: cred.user.emailVerified,
        authProvider: 'google',
      });
    }
    return { user: cred.user, error: null, isNewUser: !existingProfile };
  } catch (err) {
    return { user: null, error: toFriendlyMessage(err), isNewUser: false };
  }
}

export async function logout() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function requestPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function completePasswordReset(oobCode, newPassword) {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function resendVerificationEmail() {
  try {
    if (!auth.currentUser) throw new Error('No user logged in');
    await sendEmailVerification(auth.currentUser);
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

/**
 * Subscribes to auth state changes. Returns the unsubscribe function —
 * always call this in a useEffect cleanup to avoid leaking listeners.
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}
