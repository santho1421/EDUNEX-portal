import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { logoutFirebase } from '../services/firebaseAuth';
import { login as backendLogin } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sb_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const tokenRefreshTimerRef = useRef(null);

  // ── Token refresh helper ────────────────────────────────────────────────────
  const scheduleTokenRefresh = (firebaseUser) => {
    if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);
    // Refresh token every 55 minutes (tokens expire in 60 min)
    tokenRefreshTimerRef.current = setTimeout(async () => {
      try {
        const newToken = await firebaseUser.getIdToken(true); // force refresh
        localStorage.setItem('sb_token', newToken);
        scheduleTokenRefresh(firebaseUser); // schedule next refresh
      } catch (e) {
        console.error('Token refresh failed:', e);
      }
    }, 55 * 60 * 1000);
  };

  // ── Firebase Auth state listener ────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Skip backendLogin if this is a brand new user who is currently registering
        // via handleCollegeRegister or handleCompanyRegister.
        // We can detect this by checking if they just signed up (creation time is very recent)
        // or we can rely on the frontend's manual login() call to set the state.
        const creationTime = new Date(firebaseUser.metadata.creationTime).getTime();
        const now = Date.now();
        const isNewUser = now - creationTime < 10000; // Created within last 10 seconds
        
        if (isNewUser) {
          // Allow the registration functions in Login.jsx to handle setting the user state.
          // Just set the token for now.
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('sb_token', token);
          setLoading(false);
          return;
        }

        try {
          // Always get a fresh token
          const token = await firebaseUser.getIdToken(true);
          localStorage.setItem('sb_token', token);
          scheduleTokenRefresh(firebaseUser);

          // Verify with backend to get role/onboarding status
          const res = await backendLogin();

          if (res.data.success) {
            if (res.data.action === 'ONBOARDING_REQUIRED') {
              const onboardingUser = {
                uid: res.data.user.uid,
                id: res.data.user.uid,
                email: res.data.user.email,
                needsOnboarding: true,
              };
              localStorage.setItem('sb_user', JSON.stringify(onboardingUser));
              setUser(onboardingUser);
            } else if (res.data.action === 'LOGIN_SUCCESS') {
              const userData = { ...res.data.user, id: res.data.user.uid };
              localStorage.setItem('sb_user', JSON.stringify(userData));
              setUser(userData);

              // Force refresh token so newly assigned roles/claims from backend are picked up
              const freshToken = await firebaseUser.getIdToken(true);
              localStorage.setItem('sb_token', freshToken);
            }
          }
        } catch (e) {
          console.error('Backend auth verification failed:', e);
          // Don't log out — the token might still be valid, network could be down
          // Just keep whatever user was in localStorage
          const saved = localStorage.getItem('sb_user');
          if (!saved) {
            localStorage.removeItem('sb_token');
            setUser(null);
          }
        }
      } else {
        if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);
        localStorage.removeItem('sb_token');
        localStorage.removeItem('sb_user');
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);
    };
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('sb_token', token);
    const normalized = { ...userData, id: userData.uid || userData.id };
    localStorage.setItem('sb_user', JSON.stringify(normalized));
    setUser(normalized);
  };

  const logout = async () => {
    if (tokenRefreshTimerRef.current) clearTimeout(tokenRefreshTimerRef.current);
    await logoutFirebase();
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_user');
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('sb_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
