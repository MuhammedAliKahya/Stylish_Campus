'use client';

import { useState } from 'react';
import { MapPin, Heart, Star } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatPrice, STATUS_LABELS, STATUS_STYLES } from '@/lib/format';
import { useNav } from '@/lib/nav';
import { useAuth } from '@/lib/auth';
import { isFavorite, toggleFavorite, getSellerAverageRating } from '@/lib/store';
import { cn } from '@/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const { navigate, bumpData } = useNav();
  const { user } = useAuth();
  const img = product.images[0];

  // Satıcı ortalama puanı — her render'da hesaplanır (localStorage prototipi)
  const sellerRating = getSellerAverageRating(product.sellerId);

  // Başlangıç değeri store'dan okunur → sayfa yenilenince kalıcı
  const [favorited, setFavorited] = useState(() =>
    user ? isFavorite(user.id, product.id) : false
  );

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Kart tıklamasını tetikleme
    if (!user) return;
    const next = toggleFavorite(user.id, product.id);
    setFavorited(next);
    bumpData(); // Profil sekmesi anlık güncellensin
  };

  return (
    <button
      onClick={() => navigate({ name: 'product', productId: product.id })}
      className="group text-left animate-fade-in"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
            Görsel yok
          </div>
        )}

        {/* ❤ Favori butonu — sağ üst köşe */}
        {user && (
          <button
            type="button"
            onClick={handleFavorite}
            aria-label={favorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            aria-pressed={favorited}
            className={cn(
              'absolute top-2.5 right-2.5 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm',
              favorited
                ? 'bg-rose-500 text-white scale-110'
                : 'bg-white/80 backdrop-blur-sm text-foreground/50 hover:text-rose-500 hover:bg-white'
            )}
          >
            <Heart
              className={cn('h-4 w-4 transition-all', favorited && 'fill-current')}
              strokeWidth={favorited ? 0 : 1.5}
            />
          </button>
        )}

        {/* Price tag — absolute white */}
        <div className="absolute bottom-3 left-3 bg-white px-3 py-1.5 rounded-full shadow-sm">
          <span className="font-serif-display text-sm font-semibold text-primary">
            {formatPrice(product.price)}
          </span>
        </div>
        {/* Status badge */}
        {product.status !== 'active' && (
          <div
            className={cn(
              'absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium border',
              STATUS_STYLES[product.status]
            )}
          >
            {STATUS_LABELS[product.status]}
          </div>
        )}
        {/* Size & condition pills */}
        {product.size && (
          <div className="absolute top-3 left-3 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
            {product.size}
          </div>
        )}
        {product.condition && (
          <div className="absolute top-3 left-3 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm" style={product.size ? { top: '2.75rem' } : undefined}>
            {product.condition}
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-serif-display text-base font-medium leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{product.meetupLocation}</span>
        </div>
        {/* Satıcı puanı */}
        <div className="flex items-center gap-1">
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
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground/60 italic">Henüz değerlendirilmedi</span>
          )}
        </div>
      </div>
    </button>
  );
}
