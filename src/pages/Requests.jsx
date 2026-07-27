import { useEffect, useState } from 'react';
import { Inbox, Check, X, Ban, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getRequestsForUser,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  completeRequest,
} from '../services/requestService';
import { createBooking } from '../services/bookingService';

const TABS = [
  { key: 'learner', label: 'Sent by Me' },
  { key: 'mentor', label: 'Received' },
];

const STATUS_STYLE = {
  pending: 'bg-warning/15 text-warning border-warning/25',
  accepted: 'bg-accent2/15 text-accent2 border-accent2/25',
  rejected: 'bg-danger/15 text-danger border-danger/25',
  cancelled: 'bg-white/10 text-muted border-border',
  completed: 'bg-accent/15 text-accent border-accent/25',
};

export default function Requests() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState('learner');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const items = await getRequestsForUser(firebaseUser.uid, role);
    setRequests(items);
    setLoading(false);
  }

  useEffect(() => {
    if (firebaseUser) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, role]);

  async function handleAccept(r) {
    const { error } = await acceptRequest(r.id, r.skillTitle);
    if (error) return showToast(error, 'error');
    // Auto-schedule a booking for tomorrow at the same time as a sensible default —
    // mentor/learner can coordinate the exact time over chat.
    const tomorrow = new Date(Date.now() + 86400000);
    const date = tomorrow.toISOString().slice(0, 10);
    const time = '10:00';
    await createBooking({
      learnerId: r.learnerId,
      mentorId: r.mentorId,
      skillId: r.skillId,
      skillTitle: r.skillTitle,
      date,
      time,
      requestId: r.id,
    });
    showToast('Request accepted & session scheduled 🎉', 'success');
    load();
  }

  async function handleReject(r) {
    const { error } = await rejectRequest(r.id, r.skillTitle);
    if (error) return showToast(error, 'error');
    showToast('Request declined', 'info');
    load();
  }

  async function handleCancel(r) {
    const { error } = await cancelRequest(r.id, r.skillTitle);
    if (error) return showToast(error, 'error');
    showToast('Request cancelled', 'info');
    load();
  }

  async function handleComplete(r) {
    const { error } = await completeRequest(r.id, r.skillTitle);
    if (error) return showToast(error, 'error');
    showToast('Marked as complete ✅', 'success');
    load();
  }

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-[900px] px-6 py-8">
        <div className="mb-6">
          <h1 className="mb-1 text-[28px]">Learning Requests</h1>
          <p className="text-sm text-muted">Track requests you've sent and received.</p>
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
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
              <Inbox size={28} className="text-accent" />
            </div>
            <h3 className="text-lg">No requests yet</h3>
            <p className="mt-1.5 text-sm text-muted">
              {role === 'learner' ? (
                <>
                  Browse the{' '}
                  <button className="text-accent hover:underline" onClick={() => navigate('/marketplace')}>
                    marketplace
                  </button>{' '}
                  and send a request to a mentor.
                </>
              ) : (
                'Requests learners send you will show up here.'
              )}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <div key={r.id} className="card">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-semibold">{r.skillTitle}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[r.status]}`}>
                    {r.status}
                  </span>
                </div>
                {r.message && <p className="mb-3 text-sm text-muted">{r.message}</p>}
                {role === 'mentor' && r.status === 'pending' && (
                  <div className="flex gap-2">
                    <button className="btn-success text-xs" onClick={() => handleAccept(r)}>
                      <Check size={13} /> Accept
                    </button>
                    <button className="btn-danger text-xs" onClick={() => handleReject(r)}>
                      <X size={13} /> Decline
                    </button>
                  </div>
                )}
                {role === 'learner' && r.status === 'pending' && (
                  <button className="btn-secondary text-xs" onClick={() => handleCancel(r)}>
                    <Ban size={13} /> Cancel Request
                  </button>
                )}
                {role === 'mentor' && r.status === 'accepted' && (
                  <button className="btn-success text-xs" onClick={() => handleComplete(r)}>
                    <CheckCircle2 size={13} /> Mark Complete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}