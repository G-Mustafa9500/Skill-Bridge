// Reusable Firestore service for the community leaderboard.
// Ranking combines average rating and total completed sessions into one trust
// score so a mentor with a perfect rating but 1 session doesn't outrank someone
// with hundreds of solid sessions.

import { collection, getDocs, query, orderBy, limit as fsLimit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toFriendlyMessage } from '../utils/errorMessages';

function trustScore(user) {
  return (user.rating || 0) * 20 + (user.totalSessions || 0) * 2;
}

export async function getLeaderboard(topN = 50) {
  try {
    // Firestore can't sort by a computed field, so we pull the top-N by
    // totalSessions (a reasonable proxy) and re-rank client-side by trust score.
    const q = query(collection(db, 'users'), orderBy('totalSessions', 'desc'), fsLimit(topN));
    const snap = await getDocs(q);
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return users.map((u) => ({ ...u, trustScore: trustScore(u) })).sort((a, b) => b.trustScore - a.trustScore);
  } catch (err) {
    console.error('[leaderboardService] getLeaderboard failed:', toFriendlyMessage(err));
    return [];
  }
}