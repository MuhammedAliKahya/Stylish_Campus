'use client';

import { useState, useEffect } from 'react';
import { NavProvider, useNav, type View } from '@/lib/nav';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  GraduationCap,
  Search,
  Plus,
  MessageSquare,
  User as UserIcon,
  Receipt,
  Shield,
  LogOut,
  ChevronLeft,
  Home,
  X,
} from 'lucide-react';
import { FeedView } from '@/components/views/feed';
import { ProductDetail } from '@/components/views/product-detail';
import { ListingForm } from '@/components/views/listing-form';
import { ChatListView } from '@/components/views/chat-list';
import { ChatView } from '@/components/views/chat';
import { ProfileView } from '@/components/views/profile';
import { TransactionsView } from '@/components/views/transactions';
import { AdminView } from '@/components/views/admin';
import { getConversations, getMessages } from '@/lib/store';

function AppShellInner() {
  const { view, navigate, back, dataVersion } = useNav();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Compute unread messages count for the nav badge.
  useEffect(() => {
    if (!user) return;
    void dataVersion;
    const conversations = getConversations().filter(
      (c) => c.buyerId === user.id || c.sellerId === user.id
    );
    let count = 0;
    for (const c of conversations) {
      const msgs = getMessages().filter((m) => m.conversationId === c.id);
      for (const m of msgs) {
        if (m.senderId !== user.id && !m.isRead) count += 1;
      }
    }
    setUnreadCount(count);
  }, [user, dataVersion]);

  // Listen for "clear-search" events from the feed view.
  useEffect(() => {
    const handler = () => setSearch('');
    window.addEventListener('clear-search', handler);
    return () => window.removeEventListener('clear-search', handler);
  }, []);

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const showBack = view.name !== 'feed';
  const showSearch = view.name === 'feed';
  const showFAB =
    view.name === 'feed' ||
    view.name === 'chat-list' ||
    view.name === 'profile' ||
    view.name === 'transactions';

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {showBack && (
            <button
              onClick={back}
              aria-label="Geri"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Geri</span>
            </button>
          )}

          <button
            onClick={() => navigate({ name: 'feed' })}
            className="flex items-center gap-2 shrink-0"
          >
            <GraduationCap className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <span className="font-serif-display text-xl font-semibold tracking-tight text-primary hidden sm:inline">
              Stylish Campus
            </span>
          </button>

          {showSearch && (
            <div className="flex-1 max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  aria-label="Ara"
                  placeholder="İlan, kategori, beden, durum ara…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-9 rounded-full bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    aria-label="Aramayı temizle"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {!showSearch && <div className="flex-1" />}

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => navigate({ name: 'chat-list' })}
              className="relative p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Mesajlar"
            >
              <MessageSquare className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-accent transition-colors" aria-label="Hesap menüsü">
                  <Avatar className="h-8 w-8">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-foreground/80">
                    {user.fullName.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ name: 'profile' })}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profilim</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ name: 'transactions' })}>
                  <Receipt className="mr-2 h-4 w-4" />
                  <span>İşlemlerim</span>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate({ name: 'admin' })}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Yönetim Paneli</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {view.name === 'feed' && <FeedView search={search} />}
        {view.name === 'product' && <ProductDetail productId={view.productId} />}
        {view.name === 'create' && <ListingForm mode="create" />}
        {view.name === 'edit' && <ListingForm mode="edit" productId={view.productId} />}
        {view.name === 'chat-list' && <ChatListView />}
        {view.name === 'chat' && <ChatView conversationId={view.conversationId} />}
        {view.name === 'profile' && <ProfileView />}
        {view.name === 'transactions' && <TransactionsView />}
        {view.name === 'admin' && <AdminView />}
      </main>

      {/* FAB */}
      {showFAB && (
        <button
          onClick={() => navigate({ name: 'create' })}
          className="fixed bottom-20 sm:bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
          aria-label="İlan Ekle"
        >
          <Plus className="h-6 w-6" strokeWidth={1.5} />
        </button>
      )}

      {/* Mobile bottom navigation */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-md border-t border-border" aria-label="Mobil navigasyon">
        <div className="flex items-center justify-around h-16 px-2">
          <button
            onClick={() => navigate({ name: 'feed' })}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
              view.name === 'feed' ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-label="Ana Sayfa"
            aria-current={view.name === 'feed' ? 'page' : undefined}
          >
            <Home className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Ana Sayfa</span>
          </button>
          <button
            onClick={() => navigate({ name: 'chat-list' })}
            className={cn(
              'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
              view.name === 'chat-list' || view.name === 'chat' ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-label="Mesajlar"
            aria-current={view.name === 'chat-list' || view.name === 'chat' ? 'page' : undefined}
          >
            <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <span className="text-[10px] font-medium">Mesajlar</span>
          </button>
          <button
            onClick={() => navigate({ name: 'create' })}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
              view.name === 'create' || view.name === 'edit' ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-label="İlan Ekle"
            aria-current={view.name === 'create' || view.name === 'edit' ? 'page' : undefined}
          >
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Plus className="h-4 w-4" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium">İlan Ekle</span>
          </button>
          <button
            onClick={() => navigate({ name: 'profile' })}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
              view.name === 'profile' || view.name === 'transactions' ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-label="Profil"
            aria-current={view.name === 'profile' || view.name === 'transactions' ? 'page' : undefined}
          >
            <UserIcon className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export function AppShell() {
  return (
    <NavProvider>
      <AppShellInner />
    </NavProvider>
  );
}
