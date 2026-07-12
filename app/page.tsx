'use client';

import { useAuth } from '@/lib/auth';
import LoginPage from './login/page';
import { AppShell } from '@/components/app-shell';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Yükleniyor…</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AppShell />;
}
