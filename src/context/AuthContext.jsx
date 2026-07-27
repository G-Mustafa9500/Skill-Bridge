import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { subscribeToAuthChanges } from '../services/authService';
import { getUserProfile } from '../services/userService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null);
      return;
    }
    const p = await getUserProfile(uid);
    setProfile(p);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setFirebaseUser(user);
      if (user) {
        await refreshProfile(user.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [refreshProfile]);

  const value = {
    firebaseUser,
    profile,
    loading,
    isAuthenticated: !!firebaseUser,
    // Onboarding is considered complete once the user has picked at least one skill.
    needsOnboarding: !!firebaseUser && !!profile && (!profile.skills || profile.skills.length === 0),
    refreshProfile: () => refreshProfile(firebaseUser?.uid),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
