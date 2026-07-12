'use client';

import { useMemo } from 'react';
import { useNav } from '@/lib/nav';
import { useAuth } from '@/lib/auth';
import {
  getConversations,
  getMessages,
  getProductById,
  getUserById,
} from '@/lib/store';
import { MessageSquare } from 'lucide-react';
import { formatRelative } from '@/lib/format';

export function ChatListView() {
  const { navigate, dataVersion } = useNav();
  const { user } = useAuth();

  const conversations = useMemo(() => {
    void dataVersion;
    if (!user) return [];
    return getConversations()
      .filter((c) => c.buyerId === user.id || c.sellerId === user.id)
      .map((c) => {
        const product = getProductById(c.productId);
        const messages = getMessages().filter((m) => m.conversationId === c.id);
        const lastMessage = messages[messages.length - 1];
        const otherUserId = c.buyerId === user.id ? c.sellerId : c.buyerId;
        const otherUser = getUserById(otherUserId);
        const unread = messages.filter(
          (m) => m.senderId !== user.id && !m.isRead
        ).length;
        return { conv: c, product, lastMessage, otherUser, unread };
      })
      .filter((x) => x.product && x.otherUser)
      .sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || a.conv.createdAt;
        const bTime = b.lastMessage?.createdAt || b.conv.createdAt;
        return bTime.localeCompare(aTime);
      });
  }, [user, dataVersion]);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" strokeWidth={1} />
        <h3 className="font-serif-display text-lg font-medium text-foreground/80">
          Henüz mesaj yok
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Bir ilana mesaj atarak sohbet başlatabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="font-serif-display text-2xl font-semibold mb-6">Mesajlar</h1>
      <div className="space-y-1">
        {conversations.map(({ conv, product, lastMessage, otherUser, unread }) => {
          if (!product || !otherUser) return null;
          return (
            <button
              key={conv.id}
              onClick={() => navigate({ name: 'chat', conversationId: conv.id })}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors text-left"
            >
              <div className="h-14 w-14 rounded-lg overflow-hidden bg-secondary shrink-0">
                {product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate">{otherUser.fullName}</p>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelative(lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {product.title}
                </p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {lastMessage?.content || 'Sohbeti başlatın…'}
                </p>
              </div>
              {unread > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
