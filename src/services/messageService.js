// Reusable Firestore service for `conversations` and `messages` (real-time chat).
// Conversation id is deterministic: the two participant uids sorted + joined,
// so two users always land in the same conversation regardless of who starts it.

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as fsLimit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';
import { notifyUser } from './notificationService';

const CONVERSATIONS_COLLECTION = 'conversations';

function conversationId(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}

/** Gets (or lazily creates) the 1:1 conversation between two users. */
export async function getOrCreateConversation(uidA, uidB) {
  try {
    const id = conversationId(uidA, uidB);
    const ref = doc(db, CONVERSATIONS_COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        participants: [uidA, uidB],
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        lastSenderId: null,
        createdAt: serverTimestamp(),
      });
    }
    return { id, error: null };
  } catch (err) {
    return { id: null, error: toFriendlyMessage(err) };
  }
}

export function subscribeToConversations(userId, callback) {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })), null),
    (err) => callback([], toFriendlyMessage(err))
  );
}

export function subscribeToMessages(conversationId, callback) {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION, conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
    fsLimit(200)
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })), null),
    (err) => callback([], toFriendlyMessage(err))
  );
}

/** Sends a text and/or image message, updates the conversation preview, and notifies the recipient. */
export async function sendMessage(conversationId, senderId, recipientId, { text = '', imageUrl = '' } = {}) {
  if (!text.trim() && !imageUrl) return { error: 'Message cannot be empty.' };
  try {
    const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, 'messages');
    await addDoc(messagesRef, {
      senderId,
      text: text.trim(),
      imageUrl,
      read: false,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId), {
      lastMessage: text.trim() || '📷 Image',
      lastMessageAt: serverTimestamp(),
      lastSenderId: senderId,
    });
    await notifyUser(recipientId, 'message', 'You have a new message.', { conversationId });
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

/** Marks every message from the other participant as read (for read receipts). */
export async function markMessagesRead(conversationId, readerId) {
  try {
    const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, 'messages');
    const q = query(messagesRef, where('senderId', '!=', readerId), where('read', '==', false));
    const snap = await getDocs(q);
    if (snap.empty) return { error: null };
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}