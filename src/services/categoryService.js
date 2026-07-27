// Reusable Firestore service for the `categories` collection.
// Predefined categories are seeded once; admins can add/edit/delete afterward.

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';

const CATEGORIES_COLLECTION = 'categories';

// Spec-required predefined categories. Each has a stable slug id so re-seeding is idempotent.
export const DEFAULT_CATEGORIES = [
  { id: 'web-development', name: 'Web Development', icon: 'Code2' },
  { id: 'mobile-development', name: 'Mobile Development', icon: 'Smartphone' },
  { id: 'ui-ux-design', name: 'UI/UX Design', icon: 'PenTool' },
  { id: 'graphic-design', name: 'Graphic Design', icon: 'Palette' },
  { id: 'video-editing', name: 'Video Editing', icon: 'Video' },
  { id: 'ai-ml', name: 'AI & Machine Learning', icon: 'Brain' },
  { id: 'digital-marketing', name: 'Digital Marketing', icon: 'Megaphone' },
  { id: 'business', name: 'Business', icon: 'Briefcase' },
  { id: 'language-learning', name: 'Language Learning', icon: 'Languages' },
  { id: 'cyber-security', name: 'Cyber Security', icon: 'ShieldCheck' },
  { id: 'data-science', name: 'Data Science', icon: 'BarChart3' },
  { id: 'cloud-computing', name: 'Cloud Computing', icon: 'Cloud' },
];

export async function getAllCategories() {
  try {
    const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('name'));
    const snap = await getDocs(q);
    if (snap.empty) {
      // Nothing seeded yet — return the defaults so the UI still works even
      // before an admin (or the seed script) has written them to Firestore.
      return DEFAULT_CATEGORIES;
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('[categoryService] getAllCategories failed:', toFriendlyMessage(err));
    return DEFAULT_CATEGORIES;
  }
}

/** Idempotent seed — safe to call multiple times, only writes categories that don't exist. */
export async function seedDefaultCategories() {
  try {
    const existing = await getDocs(collection(db, CATEGORIES_COLLECTION));
    const existingIds = new Set(existing.docs.map((d) => d.id));
    const writes = DEFAULT_CATEGORIES.filter((c) => !existingIds.has(c.id)).map((c) =>
      setDoc(doc(db, CATEGORIES_COLLECTION, c.id), { ...c, createdAt: serverTimestamp() })
    );
    await Promise.all(writes);
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function createCategory({ id, name, icon }) {
  try {
    await setDoc(doc(db, CATEGORIES_COLLECTION, id), { id, name, icon, createdAt: serverTimestamp() });
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function updateCategory(id, updates) {
  try {
    await updateDoc(doc(db, CATEGORIES_COLLECTION, id), updates);
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export async function deleteCategory(id) {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}
