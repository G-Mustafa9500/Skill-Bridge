import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSkillListing, deleteSkillListing } from '../services/skillService';
import { getUserProfile } from '../services/userService';

export default function SkillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [skill, setSkill] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getSkillListing(id).then(async (listing) => {
      if (!active) return;
      if (!listing) {
        showToast('Listing not found', 'error');
        navigate('/marketplace');
        return;
      }
      setSkill(listing);
      const mentorProfile = await getUserProfile(listing.mentorId);
      if (active) setMentor(mentorProfile);
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    const { error } = await deleteSkillListing(id);
    if (error) {
      showToast(error, 'error');
      return;
    }
    showToast('Listing deleted', 'info');
    navigate('/marketplace');
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
  if (!skill) return null;

  const isOwner = firebaseUser?.uid === skill.mentorId;
  const priceLabel = skill.isFree ? 'Free' : `$${skill.price}`;

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <button className="btn-secondary mb-5 text-sm" onClick={() => navigate('/marketplace')}>
          <ArrowLeft size={14} /> Back to Marketplace
        </button>

        {skill.images?.[0] && (
          <img src={skill.images[0]} alt={skill.title} className="mb-5 h-56 w-full rounded-xl object-cover" />
        )}

        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-[26px]">{skill.title}</h1>
          <span className="shrink-0 rounded-full border border-accent2/30 bg-accent2/15 px-3 py-1 text-sm font-semibold text-accent2">
            {priceLabel}
          </span>
        </div>

        <div className="mb-5 flex flex-wrap gap-3 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Clock size={14} /> {skill.durationMinutes} minutes
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} /> {skill.mode === 'online' ? 'Online' : 'Offline'}
          </span>
          <span className="rounded-full border border-border bg-white/5 px-2.5 py-0.5 capitalize">{skill.level}</span>
        </div>

        <div className="card mb-5">
          <h3 className="mb-2 text-sm font-semibold">Description</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{skill.description}</p>
          {skill.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skill.tags.map((t) => (
                <span key={t} className="rounded-full border border-accent/25 bg-accent/15 px-2.5 py-0.5 text-xs text-accent">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {mentor && (
          <div className="card mb-5 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full font-display text-sm font-bold text-white"
              style={{ background: '#6c63ff' }}
            >
              {mentor.fullName?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold">{mentor.fullName}</div>
              <div className="text-xs text-muted">{(mentor.skills || []).slice(0, 3).join(', ') || 'No skills listed'}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2.5">
          {!isOwner && (
            <button className="btn-primary" onClick={() => showToast('Booking flow lands in Phase 3 🚧', 'info')}>
              Book This Session
            </button>
          )}
          {isOwner && (
            <>
              <button className="btn-secondary" onClick={() => navigate(`/marketplace/${id}/edit`)}>
                <Pencil size={14} /> Edit
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
