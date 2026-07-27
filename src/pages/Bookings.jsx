import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getBookingsForUser, cancelBooking, completeBooking } from '../services/bookingService';

const TABS = [
  { key: 'learner', label: 'As Learner' },
  { key: 'mentor', label: 'As Mentor' },
];

function formatWhen(ts) {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const STATUS_STYLE = {
  upcoming: 'bg-accent/15 text-accent border-accent/25',
  completed: 'bg-accent2/15 text-accent2 border-accent2/25',
  cancelled: 'bg-danger/15 text-danger border-danger/25',
};

export default function Bookings() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [role, setRole] = useState('learner');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const items = await getBookingsForUser(firebaseUser.uid, role);
    setBookings(items);
    setLoading(false);
  }

  useEffect(() => {
    if (firebaseUser) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, role]);

  async function handleCancel(id) {
    const { error } = await cancelBooking(id);
    if (error) return showToast(error, 'error');
    showToast('Session cancelled', 'info');
    load();
  }

  async function handleComplete(id) {
    const { error } = await completeBooking(id);
    if (error) return showToast(error, 'error');
    showToast('Session marked complete ✅', 'success');
    load();
  }

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-[900px] px-6 py-8">
        <div className="mb-6">
          <h1 className="mb-1 text-[28px]">My Bookings</h1>
          <p className="text-sm text-muted">Your upcoming sessions and session history.</p>
        </div>

        <div className="mb-6 flex gap-1 rounded-[10px] bg-surface p-1" style={{ width: 'fit-content' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setRole(t.key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                role === t.key ? 'bg-surface2 text-text' : 'text-muted'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
              <Calendar size={28} className="text-accent" />
            </div>
            <h3 className="text-lg">No bookings yet</h3>
            <p className="mt-1.5 text-sm text-muted">
              {role === 'learner' ? 'Book a session from the marketplace to get started.' : 'Sessions learners book with you will show up here.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <div key={b.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold">{b.skillTitle}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[b.status]}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Clock size={12} /> {formatWhen(b.scheduledAt)}
                  </div>
                </div>
                {b.status === 'upcoming' && (
                  <div className="flex gap-2">
                    {role === 'mentor' && (
                      <button className="btn-success text-xs" onClick={() => handleComplete(b.id)}>
                        <CheckCircle2 size={13} /> Complete
                      </button>
                    )}
                    <button className="btn-danger text-xs" onClick={() => handleCancel(b.id)}>
                      <XCircle size={13} /> Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}