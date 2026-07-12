'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User } from './types';
import {
  ensureSeeded,
  getCurrentUserId,
  setCurrentUserId as storeSetCurrentUserId,
  clearCurrentUserId,
  getUserById,
  getUserByEmail,
  upsertUser,
  getOtp,
  setOtp,
  clearOtp,
  uuid,
} from './store';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  startLogin: (email: string) => { ok: boolean; error?: string; code?: string };
  verifyOtp: (
    code: string
  ) => { ok: boolean; error?: string; needsProfile?: boolean; email?: string };
  completeProfile: (fullName: string, department: string) => void;
  logout: () => void;
  refreshUser: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const EMAIL_RE = /^[\w.+-]+@[\w.-]+\.edu\.tr$/i;
const OTP_TTL_MS = 3 * 60 * 1000; // 3 minutes
const MAX_OTP_ATTEMPTS = 5;

// In-memory attempt counter (not persisted — resets on reload, fine for prototype).
let otpAttempts = 0;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    ensureSeeded();
    const id = getCurrentUserId();
    if (id) {
      const u = getUserById(id);
      if (u && !u.isBanned) {
        setUser(u);
      } else {
        clearCurrentUserId();
      }
    }
    setLoading(false);
  }, []);

  const refreshUser = useCallback(() => {
    const id = getCurrentUserId();
    if (id) {
      const u = getUserById(id);
      if (u) setUser(u);
    }
  }, []);

  const startLogin = useCallback(
    (email: string): { ok: boolean; error?: string; code?: string } => {
      const trimmed = email.trim().toLowerCase();
      if (!EMAIL_RE.test(trimmed)) {
        return {
          ok: false,
          error: 'Sadece .edu.tr uzantılı e-postalar kabul edilir.',
        };
      }
      const existing = getUserByEmail(trimmed);
      if (existing && existing.isBanned) {
        return {
          ok: false,
          error: 'Hesabınız yasaklanmıştır. Lütfen yönetici ile iletişime geçin.',
        };
      }
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setOtp({ code, email: trimmed, expiresAt: Date.now() + OTP_TTL_MS });
      otpAttempts = 0;
      setPendingEmail(trimmed);
      return { ok: true, code };
    },
    []
  );

  const verifyOtp = useCallback(
    (code: string): {
      ok: boolean;
      error?: string;
      needsProfile?: boolean;
      email?: string;
    } => {
      const record = getOtp();
      if (!record) {
        return { ok: false, error: 'Doğrulama kodu bulunamadı. Tekrar deneyin.' };
      }
      if (Date.now() > record.expiresAt) {
        clearOtp();
        return {
          ok: false,
          error: 'Doğrulama kodunun süresi doldu. Lütfen yeni kod isteyin.',
        };
      }
      if (code.trim() !== record.code) {
        otpAttempts += 1;
        if (otpAttempts >= MAX_OTP_ATTEMPTS) {
          clearOtp();
          otpAttempts = 0;
          return {
            ok: false,
            error:
              'Çok fazla hatalı deneme. Doğrulama kodu geçersiz kılındı, lütfen yeni kod isteyin.',
          };
        }
        return { ok: false, error: 'Hatalı kod. Tekrar deneyin.' };
      }
      const existing = getUserByEmail(record.email);
      if (existing) {
        if (existing.isBanned) {
          clearOtp();
          return {
            ok: false,
            error: 'Hesabınız yasaklanmıştır. Lütfen yönetici ile iletişime geçin.',
          };
        }
        storeSetCurrentUserId(existing.id);
        setUser(existing);
        clearOtp();
        return { ok: true };
      }
      setPendingEmail(record.email);
      return { ok: true, needsProfile: true, email: record.email };
    },
    []
  );

  const completeProfile = useCallback(
    (fullName: string, department: string) => {
      if (!pendingEmail) return;
      const newUser: User = {
        id: uuid(),
        email: pendingEmail,
        fullName: fullName.trim(),
        department: department.trim() || undefined,
        role: 'student',
        isBanned: false,
        createdAt: new Date().toISOString(),
      };
      upsertUser(newUser);
      storeSetCurrentUserId(newUser.id);
      setUser(newUser);
      clearOtp();
      setPendingEmail(null);
    },
    [pendingEmail]
  );

  const logout = useCallback(() => {
    clearCurrentUserId();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, startLogin, verifyOtp, completeProfile, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
