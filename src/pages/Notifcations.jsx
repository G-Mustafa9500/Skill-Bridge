import { useEffect, useState } from 'react';
import { Bell, MessageSquare, Calendar, Star, Sparkles, Megaphone } from 'lucide-react';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationService';

const ICONS = {
  booking_request: Calendar,
  booking_approved: Calendar,
  booking_cancelled: Calendar,
  message: MessageSquare,
  review: Star,
  ai_recommendation: Sparkles,
  admin_announcement: Megaphone,
};

function timeAgo(ts) {
  if (!ts?.toDate) return 'just now';
  const s = (Date.now() - ts.toDate().getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Notifications() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = subscribeToNotifications(firebaseUser.uid, (items) => {
      setNotifications(items);
      setLoading(false);
    });
    return unsubscribe;
  }, [firebaseUser]);

  async function handleMarkAll() {
    await markAllNotificationsRead(firebaseUser.uid);
  }

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-[800px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-[28px]">Notifications</h1>
            <p className="text-sm text-muted">Stay up to date with community activity.</p>
          </div>
          <button className="btn-secondary text-xs" onClick={handleMarkAll}>
            Mark All Read
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-accent/20 bg-accent/10">
              <Bell size={28} className="text-accent" />
            </div>
            <h3 className="text-lg">No notifications</h3>
            <p className="mt-1.5 text-sm text-muted">When something happens, you'll see it here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && markNotificationRead(n.id)}
                  className={`flex cursor-pointer items-start gap-3.5 rounded border px-4 py-3.5 transition-colors ${
                    n.read ? 'border-border bg-surface' : 'border-accent/25 bg-accent/[0.04]'
                  }`}
                >
                  <Icon size={18} className="mt-0.5 shrink-0 text-accent" />
                  <div className="flex-1">
                    <div className="text-sm">{n.text}</div>
                    <div className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}