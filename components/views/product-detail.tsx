'use client';

import { useState, useMemo } from 'react';
import { useNav } from '@/lib/nav';
import { useAuth } from '@/lib/auth';

import {
  getProductById,
  getUserById,
  getConversationForProduct,
  upsertConversation,
  deleteProduct,
  uuid,
  isFavorite,
  toggleFavorite,
  getSellerAverageRating,
} from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MapPin,
  BadgeCheck,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Heart,
  Star,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatPrice, STATUS_LABELS, STATUS_STYLES } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ProductDetail({ productId }: { productId: string }) {
  const { navigate, bumpData, dataVersion } = useNav();
  const { user } = useAuth();
  const [imageIdx, setImageIdx] = useState(0);

  // Favori durumu — başlangıç store'dan okunur
  const [favorited, setFavorited] = useState(() =>
    user ? isFavorite(user.id, productId) : false
  );

  const handleFavorite = () => {
    if (!user) return;
    const next = toggleFavorite(user.id, productId);
    setFavorited(next);
    bumpData();
  };

  const product = useMemo(() => {
    void dataVersion;
    return getProductById(productId);
  }, [productId, dataVersion]);

  if (!product) {
    return (
      <div className="py-24 text-center text-muted-foreground">İlan bulunamadı.</div>
    );
  }

  const seller = getUserById(product.sellerId);
  const sellerRating = getSellerAverageRating(product.sellerId);
  const isOwner = user?.id === product.sellerId;
  const isReserved = product.status === 'reserved';
  const isSold = product.status === 'sold';
  const isBanned = product.status === 'banned';
  const ctaDisabled = isOwner || isReserved || isSold || isBanned;

  const handleContact = () => {
    if (!user || isOwner) return;
    let conv = getConversationForProduct(product.id, user.id);
    if (!conv) {
      conv = {
        id: uuid(),
        productId: product.id,
        buyerId: user.id,
        sellerId: product.sellerId,
        createdAt: new Date().toISOString(),
      };
      upsertConversation(conv);
      bumpData();
    }
    navigate({ name: 'chat', conversationId: conv.id });
  };

  const handleDelete = () => {
    deleteProduct(product.id);
    bumpData();
    toast.success('İlan silindi.');
    navigate({ name: 'feed' });
  };

  const formatDateTR = (iso: string) =>
    new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  const ctaLabel = isBanned
    ? 'Bu ilan kaldırılmış'
    : isSold
    ? 'Satıldı'
    : isReserved
    ? 'Rezerve Edildi'
    : isOwner
    ? 'Kendi ilanınız'
    : 'Buluşmak İçin Mesaj At';

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image carousel */}
        <div className="relative">
          <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
            {product.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[imageIdx]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                Görsel yok
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <>
              <button
                onClick={() => setImageIdx((i) => (i - 1 + product.images.length) % product.images.length)}
                aria-label="Önceki görsel"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setImageIdx((i) => (i + 1) % product.images.length)}
                aria-label="Sonraki görsel"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIdx(i)}
                    aria-label={`${i + 1}. görsel`}
                    aria-pressed={i === imageIdx}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === imageIdx ? 'w-6 bg-primary' : 'w-1.5 bg-primary/30'
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div className="space-y-2">
            {product.status !== 'active' && (
              <span
                className={cn(
                  'inline-block px-2.5 py-1 rounded-full text-xs font-medium border',
                  STATUS_STYLES[product.status]
                )}
              >
                {STATUS_LABELS[product.status]}
              </span>
            )}
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-serif-display text-2xl md:text-3xl font-semibold leading-tight">
                {product.title}
              </h1>
              {user && (
                <button
                  type="button"
                  onClick={handleFavorite}
                  aria-label={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                  aria-pressed={favorited}
                  className={cn(
                    'shrink-0 mt-1 h-10 w-10 rounded-full flex items-center justify-center border transition-all duration-200',
                    favorited
                      ? 'bg-rose-500 border-rose-500 text-white scale-105'
                      : 'bg-background border-border text-foreground/40 hover:border-rose-400 hover:text-rose-500'
                  )}
                >
                  <Heart
                    className={cn('h-5 w-5 transition-all', favorited && 'fill-current')}
                    strokeWidth={favorited ? 0 : 1.5}
                  />
                </button>
              )}
            </div>
            <p className="font-serif-display text-3xl font-semibold text-primary">
              {formatPrice(product.price)}
            </p>
          </div>

          {/* Spec pills */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">
              {product.category}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">
              {product.condition}
            </span>
            {product.size && (
              <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">
                Beden: {product.size}
              </span>
            )}
          </div>

          {/* Meetup location */}
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{product.meetupLocation}</span>
          </div>

          {/* Published date */}
          <p className="text-xs text-muted-foreground">
            Yayınlanma: {formatDateTR(product.createdAt)}
          </p>

          {/* Description */}
          <div className="pt-2 border-t border-border">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
              Açıklama
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
              {product.description}
            </p>
          </div>

          {/* Seller box */}
          {seller && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
              <Avatar className="h-12 w-12">
                {seller.avatarUrl && <AvatarImage src={seller.avatarUrl} alt={seller.fullName} />}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {seller.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{seller.fullName}</p>
                <div className="flex items-center gap-1 text-xs text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span>Doğrulanmış Öğrenci</span>
                </div>
                {seller.department && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {seller.department}
                  </p>
                )}
                {/* Satıcı puanı */}
                <div className="flex items-center gap-1 mt-1">
                  {sellerRating ? (
                    <>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= Math.round(sellerRating.average)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/20'
                          }`}
                          strokeWidth={1}
                        />
                      ))}
                      <span className="text-[10px] text-amber-600 font-medium ml-0.5">
                        {sellerRating.average.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({sellerRating.count} değerlendirme)
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">Henüz değerlendirilmedi</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="space-y-2">
            {isOwner ? (
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => navigate({ name: 'edit', productId: product.id })}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Düzenle
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="flex-1" variant="outline">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>İlanı Sil</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu ilan kalıcı olarak silinecek. Bu işlem geri alınamaz.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        İlanı Sil
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <Button
                className="w-full h-12 text-base"
                disabled={ctaDisabled}
                onClick={handleContact}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {ctaLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
