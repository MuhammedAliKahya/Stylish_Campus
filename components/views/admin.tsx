'use client';

import { useMemo, useState } from 'react';
import { useNav } from '@/lib/nav';
import { useAuth } from '@/lib/auth';
import {
  getUsers,
  saveUsers,
  getProducts,
  saveProducts,
} from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Shield, Ban, CheckCircle } from 'lucide-react';
import { formatPrice, STATUS_LABELS, STATUS_STYLES } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function AdminView() {
  const { dataVersion, bumpData } = useNav();
  const { user } = useAuth();
  const [tab, setTab] = useState('users');

  const users = useMemo(() => {
    void dataVersion;
    return getUsers();
  }, [dataVersion]);

  const products = useMemo(() => {
    void dataVersion;
    return getProducts();
  }, [dataVersion]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="py-24 text-center text-muted-foreground">
        Bu sayfaya erişim yetkiniz yok.
      </div>
    );
  }

  // Ban/unban a user. Ban cascade: also flips all their active/reserved
  // products to "banned" in the same operation.
  const toggleBanUser = (userId: string) => {
    const allUsers = getUsers();
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return;
    if (target.role === 'admin') {
      toast.error('Yöneticiler yasaklanamaz.');
      return;
    }
    const newBanned = !target.isBanned;
    target.isBanned = newBanned;
    saveUsers(allUsers);

    // Cascade: flip active/reserved products to banned (or restore).
    // Sold products are never touched — they stay sold.
    const allProducts = getProducts();
    let changed = false;
    for (const p of allProducts) {
      if (p.sellerId === userId) {
        if (newBanned && (p.status === 'active' || p.status === 'reserved')) {
          p.status = 'banned';
          changed = true;
        } else if (!newBanned && p.status === 'banned') {
          p.status = 'active';
          changed = true;
        }
      }
    }
    if (changed) saveProducts(allProducts);
    bumpData();
    toast.success(newBanned ? 'Kullanıcı yasaklandı ve ilanları kaldırıldı.' : 'Kullanıcının yasağı kaldırıldı.');
  };

  // Ban/unban a product. Sold products cannot be banned or reactivated.
  const toggleBanProduct = (productId: string) => {
    const allProducts = getProducts();
    const target = allProducts.find((p) => p.id === productId);
    if (!target) return;
    if (target.status === 'sold') {
      toast.error('Satılmış ilanlar kaldırılamaz veya yeniden yayına alınamaz.');
      return;
    }
    if (target.status === 'banned') {
      target.status = 'active';
    } else {
      target.status = 'banned';
    }
    saveProducts(allProducts);
    bumpData();
    toast.success(target.status === 'banned' ? 'İlan kaldırıldı.' : 'İlan yayına alındı.');
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" strokeWidth={1.5} />
        <h1 className="font-serif-display text-2xl font-semibold">Yönetim Paneli</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="users">Kullanıcılar ({users.length})</TabsTrigger>
          <TabsTrigger value="products">İlanlar ({products.length})</TabsTrigger>
        </TabsList>

        {/* Users table */}
        <TabsContent value="users">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left text-xs uppercase tracking-widest text-muted-foreground font-medium px-4 py-3">Kullanıcı</th>
                    <th className="text-left text-xs uppercase tracking-widest text-muted-foreground font-medium px-4 py-3 hidden sm:table-cell">E-posta</th>
                    <th className="text-left text-xs uppercase tracking-widest text-muted-foreground font-medium px-4 py-3 hidden md:table-cell">Bölüm</th>
                    <th className="text-left text-xs uppercase tracking-widest text-muted-foreground font-medium px-4 py-3">Durum</th>
                    <th className="text-right text-xs uppercase tracking-widest text-muted-foreground font-medium px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.fullName} />}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {u.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{u.department || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                            u.isBanned
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          )}
                        >
                          {u.isBanned ? 'Yasaklı' : 'Aktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.role === 'admin' ? (
                          <span className="text-xs text-muted-foreground">Yönetici</span>
                        ) : (
                          <Button
                            size="sm"
                            variant={u.isBanned ? 'outline' : 'destructive'}
                            onClick={() => toggleBanUser(u.id)}
                          >
                            {u.isBanned ? (
                              <>
                                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                Yasağı Kaldır
                              </>
                            ) : (
                              <>
                                <Ban className="mr-1 h-3.5 w-3.5" />
                                Yasakla
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Products table */}
        <TabsContent value="products">
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left text-xs uppercase tracking-widest text-muted-foreground font-medium px-4 py-3">İlan</th>
                    <th className="text-left text-xs uppercase tracking-widest text-muted-foreground font-medium px-4 py-3 hidden sm:table-cell">Fiyat</th>
                    <th className="text-left text-xs uppercase tracking-widest text-muted-foreground font-medium px-4 py-3 hidden md:table-cell">Kategori</th>
                    <th className="text-left text-xs uppercase tracking-widest text-muted-foreground font-medium px-4 py-3">Durum</th>
                    <th className="text-right text-xs uppercase tracking-widest text-muted-foreground font-medium px-4 py-3">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const seller = users.find((u) => u.id === p.sellerId);
                    return (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-secondary shrink-0">
                              {p.images[0] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{p.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{seller?.fullName || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-serif-display font-semibold text-primary hidden sm:table-cell">
                          {formatPrice(p.price)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{p.category}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-block px-2 py-0.5 rounded-full text-xs font-medium border',
                              STATUS_STYLES[p.status]
                            )}
                          >
                            {STATUS_LABELS[p.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant={p.status === 'banned' ? 'outline' : 'destructive'}
                            onClick={() => toggleBanProduct(p.id)}
                            disabled={p.status === 'sold'}
                          >
                            {p.status === 'banned' ? (
                              <>
                                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                Geri Yayınla
                              </>
                            ) : p.status === 'sold' ? (
                              <>
                                <Ban className="mr-1 h-3.5 w-3.5" />
                                Satıldı
                              </>
                            ) : (
                              <>
                                <Ban className="mr-1 h-3.5 w-3.5" />
                                Kaldır
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
