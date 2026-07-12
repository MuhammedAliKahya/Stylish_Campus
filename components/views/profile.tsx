'use client';

import { useMemo, useState } from 'react';
import { useNav } from '@/lib/nav';
import { useAuth } from '@/lib/auth';
import { getProducts, deleteProduct, getFavorites, toggleFavorite, getSellerAverageRating } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BadgeCheck, Pencil, Trash2, Package, Heart, Star } from 'lucide-react';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ProfileView() {
  const { navigate, bumpData, dataVersion } = useNav();
  const { user } = useAuth();
  const [tab, setTab] = useState('info');

  const sellerRating = useMemo(() => {
    void dataVersion;
    if (!user) return undefined;
    return getSellerAverageRating(user.id);
  }, [user, dataVersion]);

  const myProducts = useMemo(() => {
    void dataVersion;
    if (!user) return [];
    return getProducts()
      .filter((p) => p.sellerId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [user, dataVersion]);

  const favoriteProducts = useMemo(() => {
    void dataVersion;
    if (!user) return [];
    const ids = getFavorites(user.id);
    return getProducts().filter((p) => ids.includes(p.id));
  }, [user, dataVersion]);

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleDelete = (id: string) => {
    deleteProduct(id);
    bumpData();
    toast.success('İlan silindi.');
  };

  const handleUnfavorite = (productId: string) => {
    if (!user) return;
    toggleFavorite(user.id, productId);
    bumpData();
    toast.success('Favorilerden çıkarıldı.');
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-border">
        <Avatar className="h-24 w-24">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left">
          <h1 className="font-serif-display text-2xl font-semibold">{user.fullName}</h1>
          <div className="flex items-center gap-1.5 text-primary mt-1 justify-center sm:justify-start">
            <BadgeCheck className="h-4 w-4" />
            <span className="text-sm">Doğrulanmış .edu Öğrencisi</span>
          </div>
          {user.department && (
            <p className="text-sm text-muted-foreground mt-1">{user.department}</p>
          )}
          <p className="text-xs text-muted-foreground/70 mt-1">{user.email}</p>

          {/* Satıcı puanı */}
          <div className="flex items-center gap-1.5 mt-2">
            {sellerRating ? (
              <>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= Math.round(sellerRating.average)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                      strokeWidth={1}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-amber-600">
                  {sellerRating.average.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({sellerRating.count} değerlendirme)
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground italic">Henüz değerlendirilmedi</span>
            )}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="info">Bilgilerim</TabsTrigger>
          <TabsTrigger value="listings">Aktif İlanlarım</TabsTrigger>
          <TabsTrigger value="favorites">
            <Heart className="h-3.5 w-3.5 mr-1.5" strokeWidth={1.5} />
            Favorilerim
            {favoriteProducts.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-semibold">
                {favoriteProducts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoCard label="Ad Soyad" value={user.fullName} />
            <InfoCard label="E-posta" value={user.email} />
            <InfoCard label="Bölüm" value={user.department || 'Belirtilmedi'} />
            <InfoCard label="Üyelik" value={user.role === 'admin' ? 'Yönetici' : 'Öğrenci'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Toplam İlan" value={String(myProducts.length)} />
            <StatCard
              label="Aktif İlan"
              value={String(myProducts.filter((p) => p.status === 'active').length)}
            />
          </div>
        </TabsContent>

        <TabsContent value="listings">
          {myProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="h-12 w-12 text-muted-foreground/40 mb-4" strokeWidth={1} />
              <h3 className="font-serif-display text-lg font-medium text-foreground/80">
                Henüz ilan yok
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                İlk ilanını eklemek için + butonuna tıkla.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  <button
                    onClick={() => navigate({ name: 'product', productId: p.id })}
                    className="flex items-center gap-4 flex-1 text-left min-w-0"
                  >
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                      {p.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.title}</p>
                      <p className="font-serif-display text-primary font-semibold text-sm">
                        {formatPrice(p.price)}
                      </p>
                      <span
                        className={cn(
                          'inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                          STATUS_STYLES[p.status]
                        )}
                      >
                        {STATUS_LABELS[p.status]}
                      </span>
                    </div>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => navigate({ name: 'edit', productId: p.id })}
                      className="p-2 rounded-lg hover:bg-accent transition-colors"
                      aria-label="Düzenle"
                    >
                      <Pencil className="h-4 w-4 text-foreground/60" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                          aria-label="Sil"
                        >
                          <Trash2 className="h-4 w-4 text-destructive/70" />
                        </button>
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
                            onClick={() => handleDelete(p.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            İlanı Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Favorilerim sekmesi */}
        <TabsContent value="favorites">
          {favoriteProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" strokeWidth={1} />
              <h3 className="font-serif-display text-lg font-medium text-foreground/80">
                Henüz favori yok
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                İlanlardaki ♥ butonuna tıklayarak favorilere ekleyebilirsin.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {favoriteProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  <button
                    onClick={() => navigate({ name: 'product', productId: p.id })}
                    className="flex items-center gap-4 flex-1 text-left min-w-0"
                  >
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                      {p.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.title}</p>
                      <p className="font-serif-display text-primary font-semibold text-sm">
                        {formatPrice(p.price)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{p.category} · {p.condition}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleUnfavorite(p.id)}
                    className="p-2 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                    aria-label="Favorilerden çıkar"
                  >
                    <Heart className="h-4 w-4 fill-rose-500 text-rose-500" strokeWidth={0} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card text-center">
      <p className="font-serif-display text-2xl font-semibold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
