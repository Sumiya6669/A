import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
  getCurrentSession,
  getCurrentUserProfile,
  onAuthStateChange,
  signInWithPassword,
  signOut,
} from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  const resetAuth = () => {
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsAuthenticated(false);
  };

  const refreshAuth = useCallback(async () => {
    if (!isSupabaseConfigured) {
      resetAuth();
      setAuthError('Supabase не настроен. Проверьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY.');
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }

    try {
      setIsLoadingAuth(true);
      setAuthError('');
      const currentSession = await getCurrentSession();
      setSession(currentSession);

      if (!currentSession) {
        resetAuth();
        return;
      }

      const { user: currentUser, profile: currentProfile } = await getCurrentUserProfile();
      setUser(currentUser);
      setProfile(currentProfile);
      setIsAuthenticated(Boolean(currentUser && currentProfile));
    } catch (error) {
      resetAuth();
      setAuthError(error.message || 'Не удалось проверить авторизацию.');
    } finally {
      setAuthChecked(true);
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
    const subscription = onAuthStateChange(() => {
      refreshAuth();
    });

    return () => subscription.unsubscribe();
  }, [refreshAuth]);

  const login = async (email, password) => {
    setAuthError('');
    await signInWithPassword(email, password);
    await refreshAuth();
  };

  const logout = async () => {
    await signOut();
    resetAuth();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      session,
      isAuthenticated, 
      isLoadingAuth,
      authError,
      authChecked,
      login,
      logout,
      refreshAuth,
      clearAuthError: () => setAuthError(''),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
