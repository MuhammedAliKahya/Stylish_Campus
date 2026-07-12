'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useNav } from '@/lib/nav';
import { useAuth } from '@/lib/auth';
import {
  getConversationById,
  getProductById,
  getUserById,
  getMessagesForConversation,
  appendMessage,
  markConversationRead,
  upsertProduct,
  upsertTransaction,
  getTransactionForProduct,
  uuid,
} from '@/lib/store';
import { CAMPUS_LOCATIONS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MapPin, Lock, CheckCheck, Check } from 'lucide-react';
import { formatTime } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ChatView({ conversationId }: { conversationId: string }) {
  const { navigate, bumpData, dataVersion } = useNav();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [meetupLoc, setMeetupLoc] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conv = useMemo(
    () => getConversationById(conversationId),
    [conversationId, dataVersion]
  );

  const product = useMemo(
    () => (conv ? getProductById(conv.productId) : undefined),
    [conv, dataVersion]
  );

  const otherUser = useMemo(() => {
    if (!conv || !user) return undefined;
    const otherId = conv.buyerId === user.id ? conv.sellerId : conv.buyerId;
    return getUserById(otherId);
  }, [conv, user, dataVersion]);

  const messages = useMemo(() => {
    void dataVersion;
    if (!conv) return [];
    return getMessagesForConversation(conv.id);
  }, [conv, dataVersion]);

  // Mark as read when opening — only bump if something actually changed.
  useEffect(() => {
    if (conv && user) {
      const changed = markConversationRead(conv.id, user.id);
      if (changed) bumpData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, user?.id]);

  // Scroll to bottom on new messages.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!conv || !product || !otherUser || !user) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        <p className="font-medium text-foreground/80 mb-1">Sohbet bulunamadı.</p>
        <p className="text-sm">Bu ilan silinmiş olabilir veya artık erişilebilir değil.</p>
      </div>
    );
  }

  const isSeller = user.id === conv.sellerId;
  const isBuyer = user.id === conv.buyerId;
  const isReserved = product.status === 'reserved';
  const isSold = product.status === 'sold';

  // Is this conversation with the reserved buyer (or seller viewing that chat)?
  const isReservedForThisBuyer = isReserved && product.reservedBuyerId === conv.buyerId;
  const isSoldToThisBuyer = isSold && (() => {
    const tx = getTransactionForProduct(product.id);
    return tx != null && (tx.buyerId === conv.buyerId || tx.sellerId === conv.buyerId);
  })();

  // Lock: when reserved or sold, only seller and the relevant buyer may send.
  const isLocked = (isReserved && !isReservedForThisBuyer) || (isSold && !isSoldToThisBuyer);
  const canSend = !isLocked || isSeller || (isBuyer && (isReservedForThisBuyer || isSoldToThisBuyer));

  const handleSend = () => {
    if (!input.trim()) return;
    if (!canSend) {
      toast.error('Bu ilan rezerve edilmiştir. Sadece satıcı ve rezerve edilen alıcı mesaj gönderebilir.');
      return;
    }
    const msg = {
      id: uuid(),
      conversationId: conv.id,
      senderId: user.id,
      content: input.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    try {
      appendMessage(msg);
      setInput('');
      bumpData();
    } catch {
      toast.error('Mesaj gönderilemedi.');
    }
  };

  const handleSuggestMeetup = () => {
    if (!meetupLoc) {
      toast.error('Lütfen bir buluşma yeri seçin.');
      return;
    }
    if (!canSend) {
      toast.error('Bu ilan rezerve edilmiştir. Buluşma yeri öneremezsiniz.');
      return;
    }
    const msg = {
      id: uuid(),
      conversationId: conv.id,
      senderId: user.id,
      content: `Buluşma yeri önerisi: ${meetupLoc}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    try {
      appendMessage(msg);
      setMeetupLoc('');
      bumpData();
      toast.success('Buluşma yeri önerildi.');
    } catch {
      toast.error('Öneri gönderilemedi.');
    }
  };

  const handleReserve = () => {
    if (!isSeller) return;
    upsertProduct({
      ...product,
      status: 'reserved',
      reservedBuyerId: conv.buyerId,
    });
    const tx = getTransactionForProduct(product.id);
    upsertTransaction({
      id: tx?.id || uuid(),
      productId: product.id,
      sellerId: product.sellerId,
      buyerId: conv.buyerId,
      meetupLocation: product.meetupLocation,
      status: 'reserved',
      createdAt: tx?.createdAt || new Date().toISOString(),
    });
    bumpData();
    toast.success('İlan bu alıcıya rezerve edildi.');
  };

  const handleCancelReservation = () => {
    if (!isSeller) return;
    upsertProduct({ ...product, status: 'active', reservedBuyerId: undefined });
    const tx = getTransactionForProduct(product.id);
    if (tx && tx.status === 'reserved') {
      upsertTransaction({ ...tx, status: 'completed' });
    }
    bumpData();
    toast.success('Rezervasyon iptal edildi. İlan tekrar aktif.');
  };

  const handleMarkSold = () => {
    if (!isSeller) return;
    upsertProduct({ ...product, status: 'sold' });
    const tx = getTransactionForProduct(product.id);
    if (tx) {
      upsertTransaction({ ...tx, status: 'seller_confirmed' });
    } else {
      upsertTransaction({
        id: uuid(),
        productId: product.id,
        sellerId: product.sellerId,
        buyerId: conv.buyerId,
        meetupLocation: product.meetupLocation,
        status: 'seller_confirmed',
        createdAt: new Date().toISOString(),
      });
    }
    bumpData();
    toast.success('Satıcı teslimatı onayladı. Alıcının onayı bekleniyor.');
  };

  const handleBuyerConfirm = () => {
    if (!isBuyer) return;
    const tx = getTransactionForProduct(product.id);
    if (tx) {
      upsertTransaction({ ...tx, status: 'completed' });
      bumpData();
      toast.success('Teslim alındı olarak işaretlendi. İşlem tamamlandı.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <button
          onClick={() => navigate({ name: 'product', productId: product.id })}
          className="h-12 w-12 rounded-lg overflow-hidden bg-secondary shrink-0 hover:opacity-80 transition-opacity"
          aria-label="İlan detayını gör"
        >
          {product.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{otherUser.fullName}</p>
          <button
            onClick={() => navigate({ name: 'product', productId: product.id })}
            className="text-xs text-muted-foreground truncate hover:text-primary transition-colors text-left block w-full"
          >
            {product.title}
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <MapPin className="h-3 w-3" />
          <span className="hidden sm:inline">{product.meetupLocation}</span>
        </div>
      </div>

      {/* Seller action bar */}
      {isSeller && !isSold && (
        <div className="flex gap-2 py-3 border-b border-border">
          {!isReserved && (
            <Button size="sm" variant="outline" onClick={handleReserve}>
              Bu Alıcıya Rezerve Et
            </Button>
          )}
          {isReservedForThisBuyer && (
            <>
              <Button size="sm" onClick={handleMarkSold}>
                Satıldı Olarak İşaretle
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelReservation}>
                Rezervasyonu İptal Et
              </Button>
            </>
          )}
        </div>
      )}

      {/* Buyer confirm bar — shown when seller confirmed, buyer hasn't yet */}
      {isBuyer && product.status === 'sold' && (() => {
        const tx = getTransactionForProduct(product.id);
        return tx && tx.status === 'seller_confirmed' ? (
          <div className="flex items-center gap-3 py-3 border-b border-border bg-amber-50/50 -mx-4 px-4 sm:mx-0 sm:rounded-lg">
            <div className="flex-1 text-sm">
              <p className="font-medium text-foreground">Satıcı teslimatı onayladı</p>
              <p className="text-xs text-muted-foreground">Eşyayı teslim aldıysanız onaylayın.</p>
            </div>
            <Button size="sm" onClick={handleBuyerConfirm}>
              Teslim Aldım
            </Button>
          </div>
        ) : null;
      })()}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            Mesajlaşmaya başlayın. Buluşma yerini önermek için aşağıdaki seçeneği kullanın.
          </div>
        )}
        {messages.map((msg) => {
          const mine = msg.senderId === user.id;
          return (
            <div
              key={msg.id}
              className={cn('flex', mine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5',
                  mine
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-secondary text-foreground rounded-bl-md'
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <div className={cn('flex items-center gap-1 mt-1', mine ? 'justify-end' : 'justify-start')}>
                  <span className={cn('text-[10px]', mine ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                    {formatTime(msg.createdAt)}
                  </span>
                  {mine && (
                    msg.isRead ? (
                      <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                    ) : (
                      <Check className="h-3 w-3 text-primary-foreground/60" />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Meetup suggestion row — hidden when locked out */}
      {canSend && (
        <div className="py-3 border-t border-border">
          <div className="flex gap-2 items-center">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <select
              value={meetupLoc}
              onChange={(e) => setMeetupLoc(e.target.value)}
              className="flex-1 h-9 rounded-full border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Buluşma Yeri Öner…</option>
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" onClick={handleSuggestMeetup} disabled={!meetupLoc}>
              Öner
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-2">
        {!canSend && (
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>
              {isSold
                ? 'Bu ilan satılmıştır. Mesaj gönderemezsiniz.'
                : 'Bu ilan başka bir alıcıya rezerve edilmiştir. Mesaj gönderemezsiniz.'}
            </span>
          </div>
        )}
        {canSend && (
          <>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Mesaj yazın…"
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend} disabled={!input.trim()} aria-label="Mesaj gönder">
              <Send className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
