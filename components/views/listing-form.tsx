'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useNav } from '@/lib/nav';
import { useAuth } from '@/lib/auth';
import {
  getProductById,
  upsertProduct,
  uuid,
  StorageQuotaError,
} from '@/lib/store';
import {
  CATEGORIES,
  CONDITIONS,
  SIZES,
  CAMPUS_LOCATIONS,
  type Product,
  type Category,
  type Condition,
} from '@/lib/types';
import { compressImage, MAX_IMAGES_PER_LISTING } from '@/lib/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FormErrors = {
  title?: string;
  price?: string;
  description?: string;
};

const TITLE_MIN = 3;
const TITLE_MAX = 80;
const DESC_MIN = 10;
const DESC_MAX = 1000;
const PRICE_MAX = 999999;

export function ListingForm({
  mode,
  productId,
}: {
  mode: 'create' | 'edit';
  productId?: string;
}) {
  const { navigate, bumpData } = useNav();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existing = useMemo(
    () => (mode === 'edit' && productId ? getProductById(productId) : undefined),
    [mode, productId]
  );

  // Ownership guard: prevent editing another user's listing.
  const isOwner = !existing || (user && existing.sellerId === user.id);

  const [title, setTitle] = useState(existing?.title || '');
  const [price, setPrice] = useState(existing ? String(existing.price) : '');
  const [description, setDescription] = useState(existing?.description || '');
  const [category, setCategory] = useState<Category>(existing?.category || 'Etek');
  const [size, setSize] = useState<string>(existing?.size || '');
  const [condition, setCondition] = useState<Condition>(existing?.condition || 'İyi');
  const [meetupLocation, setMeetupLocation] = useState<string>(
    existing?.meetupLocation || CAMPUS_LOCATIONS[0]
  );
  const [images, setImages] = useState<string[]>(existing?.images || []);
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (arr.length === 0) return;
      const remaining = MAX_IMAGES_PER_LISTING - images.length;
      if (remaining <= 0) {
        toast.error(`En fazla ${MAX_IMAGES_PER_LISTING} görsel ekleyebilirsiniz.`);
        return;
      }
      setCompressing(true);
      try {
        const compressed = await Promise.all(
          arr.slice(0, remaining).map((f) => compressImage(f))
        );
        setImages((prev) => [...prev, ...compressed]);
      } catch {
        toast.error('Görsel işlenemedi. Lütfen başka bir dosya deneyin.');
      } finally {
        setCompressing(false);
      }
    },
    [images.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (title.trim().length < TITLE_MIN || title.trim().length > TITLE_MAX) {
      next.title = `Başlık ${TITLE_MIN}-${TITLE_MAX} karakter olmalıdır.`;
    }
    const priceNum = Number(price);
    if (!price.trim() || isNaN(priceNum) || priceNum < 0 || priceNum > PRICE_MAX) {
      next.price = `Fiyat 0 ile ${PRICE_MAX.toLocaleString('tr-TR')} TL arasında olmalıdır.`;
    }
    if (description.trim().length < DESC_MIN || description.trim().length > DESC_MAX) {
      next.description = `Açıklama ${DESC_MIN}-${DESC_MAX} karakter olmalıdır.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isOwner) {
      toast.error('Bu ilanı düzenleme yetkiniz yok.');
      return;
    }
    if (!validate()) return;
    setSubmitting(true);

    const product: Product = {
      id: existing?.id || uuid(),
      sellerId: existing?.sellerId || user.id,
      title: title.trim(),
      description: description.trim(),
      price: Math.round(Number(price)),
      category,
      size: size || undefined,
      condition,
      meetupLocation,
      status: existing?.status || 'active',
      reservedBuyerId: existing?.reservedBuyerId,
      images,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    try {
      upsertProduct(product);
      bumpData();
      toast.success(mode === 'edit' ? 'İlan güncellendi.' : 'İlan yayınlandı!');
      navigate({ name: 'feed' });
    } catch (e) {
      if (e instanceof StorageQuotaError) {
        toast.error(
          'Depolama alanı doldu. Lütfen bazı görselleri kaldırıp tekrar deneyin.',
          { description: 'Tarayıcı localStorage kotası aşıldı.' }
        );
      } else {
        toast.error('Bir hata oluştu.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-serif-display text-2xl font-semibold">
          {mode === 'edit' ? 'İlanı Düzenle' : 'Yeni İlan Ekle'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Eşyanı kampüste elden teslim etmek için listele.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image upload */}
        <div className="space-y-2">
          <Label>Görseller ({images.length}/{MAX_IMAGES_PER_LISTING})</Label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
              dragOver
                ? 'border-primary bg-accent/50'
                : 'border-border hover:border-primary/30 hover:bg-accent/30'
            )}
          >
            {compressing ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Görseller işleniyor…</p>
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Upload className="h-8 w-8 text-muted-foreground/50" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">
                  Sürükleyip bırak veya tıkla ve seç
                </p>
                <p className="text-xs text-muted-foreground/70">
                  WebP, en fazla {MAX_IMAGES_PER_LISTING} görsel, ~150 KB/görsel
                </p>
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap justify-center">
                {images.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden bg-secondary group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Görsel ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES_PER_LISTING && (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6" strokeWidth={1} />
                  </div>
                )}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Başlık</Label>
          <Input
            id="title"
            placeholder="örn. Vintage Yün Kaban"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
            }}
            aria-invalid={!!errors.title}
          />
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Fiyat (TL)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            placeholder="örn. 250"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              if (errors.price) setErrors((p) => ({ ...p, price: undefined }));
            }}
            aria-invalid={!!errors.price}
          />
          {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Açıklama</Label>
          <Textarea
            id="description"
            placeholder="Eşyanın durumu, kullanım süresi, vb."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((p) => ({ ...p, description: undefined }));
            }}
            rows={4}
            aria-invalid={!!errors.description}
          />
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
        </div>

        <div className="space-y-2">
          <Label>Kategori</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                  category === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground/70 border-border hover:border-primary/30'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Beden (isteğe bağlı)</Label>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(size === s ? '' : s)}
                aria-pressed={size === s}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                  size === s
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground/70 border-border hover:border-primary/30'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Durum</Label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondition(c)}
                aria-pressed={condition === c}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                  condition === c
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground/70 border-border hover:border-primary/30'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Buluşma Yeri</Label>
          <div className="flex flex-wrap gap-2">
            {CAMPUS_LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setMeetupLocation(loc)}
                aria-pressed={meetupLocation === loc}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                  meetupLocation === loc
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground/70 border-border hover:border-primary/30'
                )}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={submitting || compressing}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kaydediliyor…
            </>
          ) : mode === 'edit' ? 'Değişiklikleri Kaydet' : 'İlanı Yayınla'}
        </Button>
      </form>
    </div>
  );
}
