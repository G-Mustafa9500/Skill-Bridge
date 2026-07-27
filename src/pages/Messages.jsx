import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, ImagePlus, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getOrCreateConversation,
  subscribeToConversations,
  subscribeToMessages,
  sendMessage,
  markMessagesRead,
} from '../services/messageService';
import { subscribeToPresence } from '../services/presenceService';
import { getUserProfile } from '../services/userService';
import { uploadImage, STORAGE_FOLDERS } from '../services/storageService';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function ConversationRow({ conv, otherProfile, isActive, onClick }) {
  const [presence, setPresence] = useState({ isOnline: false });
  useEffect(() => {
    if (!conv.otherUid) return;
    return subscribeToPresence(conv.otherUid, setPresence);
  }, [conv.otherUid]);

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
    >
      <div className="relative shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full font-display text-xs font-bold text-white" style={{ background: '#6c63ff' }}>
          {getInitials(otherProfile?.fullName)}
        </div>
        {presence.isOnline && <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg bg-accent2" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{otherProfile?.fullName || 'Loading…'}</div>
        <div className="truncate text-xs text-muted">{conv.lastMessage || 'No messages yet'}</div>
      </div>
    </button>
  );
}

export default function Messages() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  // Load conversation list in real time.
  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = subscribeToConversations(firebaseUser.uid, async (items) => {
      const withOther = items.map((c) => ({ ...c, otherUid: c.participants.find((p) => p !== firebaseUser.uid) }));
      setConversations(withOther);
      setLoading(false);

      const missing = withOther.filter((c) => c.otherUid && !profiles[c.otherUid]);
      if (missing.length) {
        const fetched = await Promise.all(missing.map((c) => getUserProfile(c.otherUid)));
        setProfiles((prev) => {
          const next = { ...prev };
          fetched.forEach((p, i) => {
            if (p) next[missing[i].otherUid] = p;
          });
          return next;
        });
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  // If arriving via ?to=<uid> (e.g. "Message Mentor" button), open/create that conversation.
  useEffect(() => {
    const to = searchParams.get('to');
    if (!to || !firebaseUser) return;
    getOrCreateConversation(firebaseUser.uid, to).then(({ id }) => {
      if (id) setActiveConvId(id);
    });
  }, [searchParams, firebaseUser]);

  // Subscribe to messages of the active conversation + mark as read.
  useEffect(() => {
    if (!activeConvId) return;
    const unsubscribe = subscribeToMessages(activeConvId, (items) => {
      setMessages(items);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    });
    markMessagesRead(activeConvId, firebaseUser.uid);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activeOtherProfile = activeConv ? profiles[activeConv.otherUid] : null;

  async function handleSend() {
    if (!text.trim() || !activeConv) return;
    const value = text;
    setText('');
    const { error } = await sendMessage(activeConvId, firebaseUser.uid, activeConv.otherUid, { text: value });
    if (error) showToast(error, 'error');
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    setUploading(true);
    const { url, error } = await uploadImage(file, STORAGE_FOLDERS.SKILL_IMAGES, firebaseUser.uid);
    setUploading(false);
    if (error) return showToast(error, 'error');
    await sendMessage(activeConvId, firebaseUser.uid, activeConv.otherUid, { imageUrl: url });
  }

  return (
    <div>
      <Navbar />
      <div className="mx-auto flex h-[calc(100vh-60px)] max-w-[1100px]">
        <div className="w-[280px] shrink-0 overflow-y-auto border-r border-border px-3 py-4">
          <h2 className="mb-3 px-2 text-sm font-semibold">Messages</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size={20} />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-2 text-xs text-muted">No conversations yet. Message a mentor from their listing.</p>
          ) : (
            conversations.map((c) => (
              <ConversationRow
                key={c.id}
                conv={c}
                otherProfile={profiles[c.otherUid]}
                isActive={c.id === activeConvId}
                onClick={() => setActiveConvId(c.id)}
              />
            ))
          )}
        </div>

        <div className="flex flex-1 flex-col">
          {!activeConvId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted">Select a conversation to start chatting.</div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full font-display text-xs font-bold text-white" style={{ background: '#6c63ff' }}>
                  {getInitials(activeOtherProfile?.fullName)}
                </div>
                <span className="text-sm font-semibold">{activeOtherProfile?.fullName || '…'}</span>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
                {messages.map((m) => {
                  const mine = m.senderId === firebaseUser.uid;
                  return (
                    <div key={m.id} className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                          mine ? 'bg-accent text-white' : 'border border-border bg-surface text-text'
                        }`}
                      >
                        {m.imageUrl && <img src={m.imageUrl} alt="" className="mb-1 max-h-48 rounded-lg" />}
                        {m.text && <div>{m.text}</div>}
                        {mine && <div className="mt-1 text-right text-[10px] opacity-70">{m.read ? 'Read' : 'Sent'}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 border-t border-border p-3.5">
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-text"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message…"
                  className="flex-1"
                />
                <button className="btn-primary !p-2.5" onClick={handleSend}>
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}