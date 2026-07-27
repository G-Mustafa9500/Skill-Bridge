import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import ImageUploader from '../components/ImageUploader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAllCategories } from '../services/categoryService';
import { createSkillListing, updateSkillListing, getSkillListing } from '../services/skillService';
import { STORAGE_FOLDERS } from '../services/storageService';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function CreateSkillListing() {
  const { id } = useParams(); // present when editing an existing listing
  const isEdit = !!id;
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState('beginner');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [mode, setMode] = useState('online');
  const [image, setImage] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getSkillListing(id).then((listing) => {
      if (!listing) {
        showToast('Listing not found', 'error');
        navigate('/marketplace');
        return;
      }
      setTitle(listing.title);
      setDescription(listing.description);
      setCategoryId(listing.categoryId);
      setLevel(listing.level);
      setIsFree(listing.isFree);
      setPrice(listing.price || '');
      setDurationMinutes(listing.durationMinutes);
      setMode(listing.mode);
      setImage(listing.images?.[0] || '');
      setTags(listing.tags || []);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function addTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(',', '');
      if (val && !tags.includes(val)) setTags((prev) => [...prev, val]);
      setTagInput('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Title is required';
    if (!description.trim()) nextErrors.description = 'Description is required';
    if (!categoryId) nextErrors.categoryId = 'Category is required';
    if (!isFree && (!price || Number(price) < 0)) nextErrors.price = 'Enter a valid price';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    const payload = {
      title,
      description,
      categoryId,
      level,
      isFree,
      price: isFree ? 0 : Number(price),
      durationMinutes: Number(durationMinutes),
      mode,
      images: image ? [image] : [],
      tags,
    };

    const result = isEdit
      ? await updateSkillListing(id, payload)
      : await createSkillListing(firebaseUser.uid, payload);
    setSaving(false);

    if (result.error) {
      showToast(result.error, 'error');
      return;
    }
    showToast(isEdit ? 'Listing updated ✅' : 'Listing posted 🚀', 'success');
    navigate(`/marketplace/${isEdit ? id : result.id}`);
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center py-24">
          <Spinner size={28} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <button className="btn-secondary mb-5 text-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="mb-6">
          <h1 className="mb-1 text-[26px]">{isEdit ? 'Edit Listing' : 'Create a Skill Listing'}</h1>
          <p className="text-sm text-muted">Share what you can teach — or offer to help — with the community.</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <ImageUploader
            folder={STORAGE_FOLDERS.SKILL_IMAGES}
            ownerId={firebaseUser.uid}
            currentUrl={image}
            onUploaded={setImage}
            label="Cover Image"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-muted">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. React fundamentals for beginners" />
            {errors.title && <div className="text-xs text-danger">{errors.title}</div>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-muted">Description *</label>
            <textarea rows={4} className="resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will you cover? What should learners expect?" />
            {errors.description && <div className="text-xs text-danger">{errors.description}</div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-muted">Category *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <div className="text-xs text-danger">{errors.categoryId}</div>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-muted">Skill Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-muted">Duration (minutes)</label>
              <input type="number" min="15" step="15" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-muted">Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-muted">Pricing</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" className="!w-auto" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} /> Free
              </label>
              {!isFree && (
                <input
                  type="number"
                  min="0"
                  placeholder="Price in USD"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="max-w-[160px]"
                />
              )}
            </div>
            {errors.price && <div className="text-xs text-danger">{errors.price}</div>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-muted">Tags (press Enter to add)</label>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="e.g. react, hooks, frontend" />
            <div className="mt-1 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-2.5 py-0.5 text-xs text-accent">
                  {t}
                  <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="leading-none">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-2 flex gap-2.5">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? <Spinner size={16} /> : isEdit ? 'Save Changes' : 'Post Listing'}
            </button>
            <button className="btn-secondary" type="button" onClick={() => navigate('/marketplace')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
