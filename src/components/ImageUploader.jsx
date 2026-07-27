import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadImage } from '../services/storageService';
import { useToast } from '../context/ToastContext';

/**
 * Reusable image uploader. Handles picking, uploading to a Storage folder,
 * and reporting the resulting download URL back to the caller via onUploaded.
 */
export default function ImageUploader({ folder, ownerId, currentUrl, onUploaded, label = 'Upload image', shape = 'square' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || null);
  const { showToast } = useToast();

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const { url, error } = await uploadImage(file, folder, ownerId);
    setUploading(false);

    if (error) {
      showToast(error, 'error');
      setPreview(currentUrl || null);
      return;
    }
    setPreview(url);
    onUploaded(url);
  }

  const shapeClass = shape === 'circle' ? 'rounded-full h-24 w-24' : 'rounded-lg h-32 w-full';

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-medium text-muted">{label}</label>
      <div
        className={`relative flex ${shapeClass} cursor-pointer items-center justify-center overflow-hidden border border-dashed border-border bg-surface2`}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus size={22} className="text-muted" />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 size={20} className="animate-spin text-white" />
          </div>
        )}
        {preview && !uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreview(null);
              onUploaded('');
            }}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
