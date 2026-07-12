'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { onStorageChange } from './store';

export type View =
  | { name: 'feed' }
  | { name: 'product'; productId: string }
  | { name: 'create' }
  | { name: 'edit'; productId: string }
  | { name: 'chat-list' }
  | { name: 'chat'; conversationId: string }
  | { name: 'profile' }
  | { name: 'transactions' }
  | { name: 'admin' };

type NavContextValue = {
  view: View;
  navigate: (view: View) => void;
  back: () => void;
  dataVersion: number;
  bumpData: () => void;
};

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>({ name: 'feed' });
  const [history, setHistory] = useState<View[]>([]);
  const [dataVersion, setDataVersion] = useState(0);

  const bumpData = useCallback(() => setDataVersion((v) => v + 1), []);

  const navigate = useCallback((next: View) => {
    setView((prev) => {
      setHistory((h) => [...h, prev]);
      return next;
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const back = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) {
        setView({ name: 'feed' });
        return h;
      }
      const prev = h[h.length - 1];
      setView(prev);
      return h.slice(0, -1);
    });
  }, []);

  // Cross-tab sync: when another tab writes to localStorage, bump dataVersion
  // so all views re-read from the store. PROTOTYPE LIMITATION: this only works
  // between tabs of the same browser, not between different devices/users.
  useEffect(() => {
    return onStorageChange(() => {
      bumpData();
    });
  }, [bumpData]);

  return (
    <NavContext.Provider value={{ view, navigate, back, dataVersion, bumpData }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
