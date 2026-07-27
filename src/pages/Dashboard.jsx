import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { seedDefaultCategories } from '../services/categoryService';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Idempotent — only writes categories that don't already exist in Firestore.
  useEffect(() => {
    seedDefaultCategories();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="mb-7">
          <h1 className="mb-1 text-[28px]">Welcome back, {profile?.fullName?.split(' ')[0] || 'there'}! 👋</h1>
          <p className="text-sm text-muted">Here's what's happening in your community today.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button className="card flex items-center gap-3 text-left transition-colors hover:border-accent/30" onClick={() => navigate('/marketplace')}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/20 bg-accent/15">
              <Store size={20} className="text-accent" />
            </div>
            <div>
              <div className="font-semibold">Browse Marketplace</div>
              <div className="text-xs text-muted">Find mentors or post your own skill listing</div>
            </div>
          </button>
          <button className="card flex items-center gap-3 text-left transition-colors hover:border-accent/30" onClick={() => navigate('/profile')}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/20 bg-accent/15">
              <User size={20} className="text-accent" />
            </div>
            <div>
              <div className="font-semibold">My Profile</div>
              <div className="text-xs text-muted">Edit your bio, skills, and listings</div>
            </div>
          </button>
        </div>

        <div className="card mt-5">
          <p className="text-sm text-muted">
            🚧 Phase 2 complete: skill categories, skill marketplace (create/edit/delete + image
            upload), and profile editing are live. Bookings, messaging, leaderboard, AI Center, and
            admin panel land in the next phases.
          </p>
        </div>
      </div>
    </div>
  );
}
