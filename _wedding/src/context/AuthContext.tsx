'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isUnlocked: boolean;
  unlock: (passcode: string) => boolean;
  lock: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EXPECTED_PASSWORD = (
  process.env.NEXT_PUBLIC_WEDDING_PASSWORD || 'Cantacuzino27'
).trim();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveAuthSession = () => {
    try {
      localStorage.setItem('wedding_auth', 'valid');
      document.cookie = 'wedding_auth=valid; Path=/; SameSite=Lax; Max-Age=2592000';
    } catch (e) {
      // Ignore private storage restrictions
    }
  };

  const clearAuthSession = () => {
    try {
      localStorage.removeItem('wedding_auth');
      document.cookie = 'wedding_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    // 1. Check URL query param ?key=... for instant guest bypass
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const keyParam = urlParams.get('key');

      if (keyParam && keyParam.trim().toLowerCase() === EXPECTED_PASSWORD.toLowerCase()) {
        saveAuthSession();
        setIsUnlocked(true);
        // Clean URL by removing ?key parameter without reloading
        urlParams.delete('key');
        const remainingQuery = urlParams.toString();
        const newUrl = window.location.pathname + (remainingQuery ? `?${remainingQuery}` : '') + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
        setIsLoading(false);
        return;
      }

      // 2. Check localStorage
      const stored = localStorage.getItem('wedding_auth');
      if (stored === 'valid') {
        setIsUnlocked(true);
        setIsLoading(false);
        return;
      }

      // 3. Check document cookie
      if (document.cookie.includes('wedding_auth=valid')) {
        setIsUnlocked(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
    }
  }, []);

  const unlock = (passcode: string): boolean => {
    if (!passcode) return false;
    if (passcode.trim().toLowerCase() === EXPECTED_PASSWORD.toLowerCase()) {
      saveAuthSession();
      setIsUnlocked(true);
      return true;
    }
    return false;
  };

  const lock = () => {
    clearAuthSession();
    setIsUnlocked(false);
  };

  return (
    <AuthContext.Provider value={{ isUnlocked, unlock, lock, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
