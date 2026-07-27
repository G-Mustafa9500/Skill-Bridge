// Reusable Firebase Storage service. Every feature that uploads a file
// (profile pictures, cover images, skill images, portfolio files, certificates)
// should go through here so path conventions and error handling stay consistent.

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function validateImageFile(file) {
  if (!file) return 'No file selected.';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Please upload a JPG, PNG, WEBP, or GIF image.';
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `Image must be under ${MAX_FILE_SIZE_MB}MB.`;
  return null;
}

/**
 * Uploads an image to a structured Storage path and returns its download URL.
 * Path convention: {folder}/{ownerId}/{timestamp}-{filename}
 * e.g. skill-images/u123/1719999999-thumbnail.png
 */
export async function uploadImage(file, folder, ownerId) {
  const validationError = validateImageFile(file);
  if (validationError) return { url: null, path: null, error: validationError };

  try {
    const path = `${folder}/${ownerId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url, path, error: null };
  } catch (err) {
    return { url: null, path: null, error: toFriendlyMessage(err) };
  }
}

export async function deleteImage(path) {
  try {
    await deleteObject(ref(storage, path));
    return { error: null };
  } catch (err) {
    return { error: toFriendlyMessage(err) };
  }
}

export const STORAGE_FOLDERS = {
  PROFILE_PICTURES: 'profile-pictures',
  COVER_IMAGES: 'cover-images',
  SKILL_IMAGES: 'skill-images',
  PORTFOLIO_FILES: 'portfolio-files',
  CERTIFICATES: 'certificates',
};
