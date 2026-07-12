'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNav } from '@/lib/nav';
import { getProducts } from '@/lib/store';
import { CATEGORIES, type Category } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Package, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 20;

export function FeedView({ search }: { search: string }) {
  const { dataVersion } = useNav();
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const products = useMemo(() => {
    void dataVersion;
    return getProducts();
  }, [dataVersion]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.status === 'active');

    // Kategori filtresi
    if (category !== 'all') {
      list = list.filter((p) => p.category === category);
    }

    // Arama filtresi
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.size?.toLowerCase().includes(q) ?? false) ||
          p.condition.toLowerCase().includes(q)
      );
    }

    // Fiyat aralığı filtresi — boş string → sınırsız
    const min = minPrice.trim() !== '' ? Number(minPrice) : -Infinity;
    const max = maxPrice.trim() !== '' ? Number(maxPrice) : Infinity;
    if (min !== -Infinity || max !== Infinity) {
      list = list.filter((p) => p.price >= min && p.price <= max);
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [products, category, search, minPrice, maxPrice]);

  const visible = filtered.slice(0, visibleCount);

  const hasPriceFilter = minPrice.trim() !== '' || maxPrice.trim() !== '';
  const hasAnyFilter = search.trim() !== '' || category !== 'all' || hasPriceFilter;

  const clearAll = () => {
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
    window.dispatchEvent(new CustomEvent('clear-search'));
  };

  // Infinite scroll
  useEffect(() => {
    const handler = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
      }
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, [filtered.length]);

  // Filtre değişince listeyi başa sar
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [category, search, minPrice, maxPrice]);

  // Akıllı boş durum mesajı — aktif filtreleri listeler
  const emptyMessage = (() => {
    const parts: string[] = [];
    if (search.trim()) parts.push(`"${search}"`);
    if (category !== 'all') parts.push(category);
    if (hasPriceFilter) {
      if (minPrice && maxPrice) parts.push(`${minPrice}–${maxPrice} TL`);
      else if (minPrice) parts.push(`min ${minPrice} TL`);
      else parts.push(`maks ${maxPrice} TL`);
    }
    return parts.length > 0
      ? `${parts.join(' · ')} için aramanla eşleşen ilan yok.`
      : 'Henüz aktif ilan yok.';
  })();

  return (
    <div className="space-y-4">
      {/* Kategori hapları */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
        {(['all', ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            aria-pressed={category === cat}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all',
              category === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground/70 border-border hover:border-primary/30 hover:text-primary'
            )}
          >
            {cat === 'all' ? 'Tümü' : cat}
          </button>
        ))}
      </div>

      {/* Fiyat aralığı filtresi */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="font-medium">Fiyat:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min ₺"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            aria-label="Minimum fiyat"
            className="h-9 w-24 rounded-full border border-border bg-background px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-muted-foreground/60 text-sm select-none">—</span>
          <input
            type="number"
            min="0"
            placeholder="Maks ₺"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            aria-label="Maksimum fiyat"
            className="h-9 w-24 rounded-full border border-border bg-background px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {hasPriceFilter && (
            <button
              onClick={() => { setMinPrice(''); setMaxPrice(''); }}
              aria-label="Fiyat filtresini temizle"
              className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sonuç satırı + Filtreleri Temizle */}
      {hasAnyFilter && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{filtered.length}</span> ilan bulundu
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Filtreleri Temizle
          </Button>
        </div>
      )}

      {/* Grid / Boş durum */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="h-12 w-12 text-muted-foreground/40 mb-4" strokeWidth={1} />
          <h3 className="font-serif-display text-lg font-medium text-foreground/80">
            Aramanla eşleşen ilan yok
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {emptyMessage}
          </p>
          {hasAnyFilter && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={clearAll}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Filtreleri Temizle
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {visible.length < filtered.length && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Daha fazla ilan yükleniyor…
        </div>
      )}
    </div>
  );
}
