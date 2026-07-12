'use client';

import { useMemo, useState } from 'react';
import { useNav, type View } from '@/lib/nav';
import { useAuth } from '@/lib/auth';
import {
  getTransactions,
  getProductById,
  getUserById,
  upsertTransaction,
  addRating,
  hasRated,
  uuid,
} from '@/lib/store';
import type { Transaction, Product, User } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Receipt, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatRelative } from '@/lib/format';

type ResolvedTxItem = {
  tx: Transaction;
  product: Product;
  otherUser: User;
};

// ── Yıldız seçici bileşeni ──────────────────────────────────────────────────
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5" role="group" aria-label="Puan seç">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} yıldız`}
          aria-pressed={value === star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          <Star
            className={cn(
              'h-6 w-6 transition-colors',
              (hovered || value) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30'
            )}
            strokeWidth={1.2}
          />
        </button>
      ))}
    </div>
  );
}

// ── Satır içi puan paneli ────────────────────────────────────────────────────
function RatingPanel({
  tx,
  buyerId,
  onRated,
}: {
  tx: Transaction;
  buyerId: string;
  onRated: () => void;
}) {
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (score === 0) {
      toast.error('Lütfen bir puan seçin.');
      return;
    }
    setSubmitting(true);
    addRating({
      id: uuid(),
      transactionId: tx.id,
      productId: tx.productId,
      buyerId,
      sellerId: tx.sellerId,
      score,
      createdAt: new Date().toISOString(),
    });
    toast.success('Puanınız kaydedildi. Teşekkürler!');
    setSubmitting(false);
    onRated();
  };

  return (
    <div className="mt-2 flex flex-col items-end gap-2 animate-fade-in">
      <p className="text-xs text-muted-foreground">Satıcıyı değerlendirin:</p>
      <StarPicker value={score} onChange={setScore} />
      <Button
        size="sm"
        className="h-7 text-xs"
        disabled={score === 0 || submitting}
        onClick={handleSubmit}
      >
        Gönder
      </Button>
    </div>
  );
}

// ── Ana görünüm ──────────────────────────────────────────────────────────────
export function TransactionsView() {
  const { navigate, bumpData, dataVersion } = useNav();
  const { user } = useAuth();
  const [tab, setTab] = useState('sales');

  const txs = useMemo(() => {
    void dataVersion;
    if (!user) return [];
    return getTransactions()
      .filter((t) => t.sellerId === user.id || t.buyerId === user.id)
      .map((t) => {
        const product = getProductById(t.productId);
        const otherId = t.sellerId === user.id ? t.buyerId : t.sellerId;
        const otherUser = getUserById(otherId);
        return { tx: t, product, otherUser };
      })
      .filter((x): x is ResolvedTxItem => Boolean(x.product && x.otherUser))
      .sort((a, b) => b.tx.createdAt.localeCompare(a.tx.createdAt));
  }, [user, dataVersion]);

  const sales = txs.filter((x) => x.tx.sellerId === user?.id);
  const purchases = txs.filter((x) => x.tx.buyerId === user?.id);

  if (!user) return null;

  const handleBuyerConfirm = (tx: Transaction) => {
    upsertTransaction({ ...tx, status: 'completed' });
    bumpData();
    toast.success('Teslim alındı olarak işaretlendi. İşlem tamamlandı.');
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h1 className="font-serif-display text-2xl font-semibold mb-6">İşlemlerim</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Elden teslim kayıtlarınız. Ödeme içermez — bu bir kampüs içi elden teslim takibidir.
      </p>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="sales">Satışlarım ({sales.length})</TabsTrigger>
          <TabsTrigger value="purchases">Alışlarım ({purchases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <TxList
            items={sales}
            navigate={navigate}
            role="seller"
            currentUserId={user.id}
            onBuyerConfirm={handleBuyerConfirm}
            onRated={bumpData}
          />
        </TabsContent>
        <TabsContent value="purchases">
          <TxList
            items={purchases}
            navigate={navigate}
            role="buyer"
            currentUserId={user.id}
            onBuyerConfirm={handleBuyerConfirm}
            onRated={bumpData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── İşlem listesi ────────────────────────────────────────────────────────────
function TxList({
  items,
  navigate,
  role,
  currentUserId,
  onBuyerConfirm,
  onRated,
}: {
  items: ResolvedTxItem[];
  navigate: (v: View) => void;
  role: 'seller' | 'buyer';
  currentUserId: string;
  onBuyerConfirm: (tx: Transaction) => void;
  onRated: () => void;
}) {
  // Hangi işlemlerin puan paneli açık olduğunu takip et
  const [ratingOpenFor, setRatingOpenFor] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground/40 mb-4" strokeWidth={1} />
        <h3 className="font-serif-display text-lg font-medium text-foreground/80">
          Kayıt yok
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {role === 'seller'
            ? 'Henüz satış veya rezervasyon kaydınız yok.'
            : 'Henüz alış veya rezervasyon kaydınız yok.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(({ tx, product, otherUser }) => {
        const isCompleted = tx.status === 'completed';
        const alreadyRated = hasRated(tx.id, currentUserId);
        const showRateButton = role === 'buyer' && isCompleted && !alreadyRated;
        const ratingPanelOpen = ratingOpenFor === tx.id;

        return (
          <div
            key={tx.id}
            className="p-3 rounded-xl border border-border bg-card transition-colors"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ name: 'product', productId: product.id })}
                className="flex items-center gap-4 flex-1 text-left min-w-0"
              >
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-secondary shrink-0">
                  {product.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {role === 'seller' ? 'Alıcı: ' : 'Satıcı: '}
                    {otherUser.fullName}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{tx.meetupLocation}</span>
                  </div>
                </div>
              </button>

              {/* Durum + aksiyon butonları */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border',
                    isCompleted
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : tx.status === 'seller_confirmed'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  )}
                >
                  {isCompleted ? 'Tamamlandı' : tx.status === 'seller_confirmed' ? 'Satıcı Onayladı' : 'Rezerve'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatRelative(tx.createdAt)}
                </span>

                {/* Teslim Aldım butonu */}
                {role === 'buyer' && tx.status === 'seller_confirmed' && (
                  <Button
                    size="sm"
                    className="h-7 text-xs mt-1"
                    onClick={() => onBuyerConfirm(tx)}
                  >
                    Teslim Aldım
                  </Button>
                )}

                {/* Puan Ver butonu */}
                {showRateButton && !ratingPanelOpen && (
                  <button
                    onClick={() => setRatingOpenFor(tx.id)}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 mt-1 transition-colors"
                    aria-label="Satıcıyı puanla"
                  >
                    <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Puan Ver
                  </button>
                )}

                {/* Puan verildi rozeti */}
                {role === 'buyer' && isCompleted && alreadyRated && (
                  <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400" strokeWidth={0} />
                    Puanlandı
                  </div>
                )}
              </div>
            </div>

            {/* Satır içi puan paneli */}
            {ratingPanelOpen && (
              <RatingPanel
                tx={tx}
                buyerId={currentUserId}
                onRated={() => {
                  setRatingOpenFor(null);
                  onRated();
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
