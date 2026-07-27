import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import ImageUploader from '../components/ImageUploader';
import SkillCard from '../components/SkillCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateUserProfile } from '../services/userService';
import { getSkillsByMentor } from '../services/skillService';
import { STORAGE_FOLDERS } from '../services/storageService';

const ALL_SKILLS = [
  'Python', 'JavaScript', 'React', 'Node.js', 'CSS', 'Figma', 'SQL',
  'Machine Learning', 'DevOps', 'Flutter', 'Cybersecurity', 'Data Science',
  'UI/UX', 'WordPress', 'Photoshop', 'Excel', 'Writing', 'Video Editing', 'SEO', 'Blockchain',
];

export default function Profile() {
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [skills, setSkills] = useState([]);
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setName(profile.fullName || '');
    setBio(profile.bio || '');
    setCity(profile.city || '');
    setSkills(profile.skills || []);
    setAvatar(profile.profilePicture || '');
  }, [profile]);

  useEffect(() => {
    if (!firebaseUser) return;
    getSkillsByMentor(firebaseUser.uid).then((items) => {
      setListings(items);
      setListingsLoading(false);
    });
  }, [firebaseUser]);

  function toggleSkill(s) {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function handleSave() {
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    setSaving(true);
    const { error } = await updateUserProfile(firebaseUser.uid, {
      fullName: name,
      bio,
      city,
      skills,
      profilePicture: avatar,
    });
    setSaving(false);
    if (error) {
      showToast(error, 'error');
      return;
    }
    await refreshProfile();
    showToast('Profile saved ✅', 'success');
  }

  if (!profile) {
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
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="mb-7">
          <h1 className="mb-1 text-[28px]">My Profile</h1>
          <p className="text-sm text-muted">Manage your public presence and skills.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="card">
            <h3 className="mb-4 text-[15px] font-semibold">Edit Profile</h3>
            <div className="flex flex-col gap-3.5">
              <ImageUploader
                folder={STORAGE_FOLDERS.PROFILE_PICTURES}
                ownerId={firebaseUser.uid}
                currentUrl={avatar}
                onUploaded={setAvatar}
                label="Profile Picture"
                shape="circle"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-muted">Display Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-muted">Bio</label>
                <textarea rows={3} className="resize-y" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-muted">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-muted">Skills</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {ALL_SKILLS.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleSkill(s)}
                      className={`select-none rounded-full border px-3 py-1.5 text-[13px] transition-all ${
                        skills.includes(s)
                          ? 'border-accent bg-accent/20 text-accent'
                          : 'border-border bg-white/5 text-muted'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn-primary self-start" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner size={16} /> : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="card">
              <h3 className="mb-3 text-[15px] font-semibold">📊 Stats</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Listings Posted</span>
                  <span className="font-semibold">{listings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total Sessions</span>
                  <span className="font-semibold">{profile.totalSessions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Rating</span>
                  <span className="font-semibold text-accent">{profile.rating || 'No ratings yet'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-[15px] font-semibold">My Listings</h3>
          {listingsLoading ? (
            <Spinner size={20} />
          ) : listings.length === 0 ? (
            <p className="text-sm text-muted">
              You haven't posted any listings yet.{' '}
              <button className="text-accent hover:underline" onClick={() => navigate('/marketplace/new')}>
                Create one
              </button>
              .
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((s) => (
                <SkillCard key={s.id} skill={s} onClick={() => navigate(`/marketplace/${s.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
