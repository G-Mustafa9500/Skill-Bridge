// Centralized error handling for the whole app.
// Rule: never show a raw Firebase/Firestore/Auth error code or stack trace to the user.
// Every service should catch its own errors and pass them through this function.

const AUTH_ERROR_MAP = {
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/invalid-email': 'That email address doesn\'t look right. Please double-check it.',
  'auth/user-disabled': 'This account has been disabled. Contact support if this is a mistake.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/weak-password': 'Please choose a stronger password (at least 6 characters).',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled before it finished.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled before it finished.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups and try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
  'auth/requires-recent-login': 'Please log in again to complete this action.',
  'auth/expired-action-code': 'This link has expired. Please request a new one.',
  'auth/invalid-action-code': 'This link is invalid or has already been used.',
};

const FIRESTORE_ERROR_MAP = {
  'permission-denied': 'You don\'t have permission to do that.',
  unavailable: 'Service is temporarily unavailable. Please try again shortly.',
  'not-found': 'The item you\'re looking for no longer exists.',
  'resource-exhausted': 'Too many requests right now. Please try again in a moment.',
  cancelled: 'The request was cancelled.',
  'deadline-exceeded': 'The request took too long. Please try again.',
};

const GEMINI_ERROR_MAP = {
  rate_limit: 'AI is a bit busy right now. Please try again in a few seconds.',
  invalid_api_key: 'AI features are temporarily unavailable. Please contact support.',
  timeout: 'The AI took too long to respond. Please try again.',
  network: 'Network error while contacting AI. Check your connection.',
  empty_response: 'AI didn\'t return a usable response. Please try again.',
};

/**
 * Converts any raw error (Firebase Auth, Firestore, Storage, or generic) into
 * a short, friendly, user-safe message. Always use this before displaying an
 * error to the user — never render err.message directly.
 */
export function toFriendlyMessage(err) {
  const code = err?.code || '';

  if (code.startsWith('auth/')) {
    return AUTH_ERROR_MAP[code] || 'Something went wrong with authentication. Please try again.';
  }
  if (FIRESTORE_ERROR_MAP[code]) {
    return FIRESTORE_ERROR_MAP[code];
  }
  if (code.startsWith('storage/')) {
    return 'File upload/download failed. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

export function toFriendlyAIMessage(kind) {
  return GEMINI_ERROR_MAP[kind] || 'AI is temporarily unavailable. Please try again.';
}
