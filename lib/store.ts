// Stylish Campus — data access layer.
// This is the ONLY module that touches localStorage. Components never call
// localStorage directly; they go through these functions.
//
// PROTOTYPE LIMITATION: There is no server and no cross-device sync. Data is
// per-browser. The window `storage` event is used only so that other tabs of the
// same browser update live — different users on different devices will NOT see
// each other's changes. This is a documented prototype limitation.
//
// localStorage budget: the whole store must fit in ~5 MB. Image data URLs are
// capped at ~150 KB each and 3 per listing. If a write would exceed the quota we
// catch QuotaExceededError and surface a friendly Turkish message (see image.ts
// and the UI error handlers).

import type {
  User,
  Product,
  Conversation,
  Message,
  Transaction,
  Rating,
} from './types';
import {
  SEED_USERS,
  SEED_PRODUCTS,
  SEED_CONVERSATIONS,
  SEED_MESSAGES,
  SEED_TRANSACTIONS,
} from './seed';

const KEYS = {
  users: 'dd_users',
  products: 'dd_products',
  conversations: 'dd_conversations',
  messages: 'dd_messages',
  transactions: 'dd_transactions',
  currentUserId: 'dd_currentUserId',
  otp: 'dd_otp',
  seeded: 'dd_seeded',
  favorites: 'dd_favorites',
  ratings: 'dd_ratings',
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  // Quota guard: if the serialized payload exceeds the ~5 MB localStorage
  // budget, setItem will throw QuotaExceededError. We rethrow a typed error so
  // callers can show a friendly Turkish message.
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new StorageQuotaError(
      'Depolama alanı doldu. Lütfen bazı görselleri kaldırıp tekrar deneyin.'
    );
  }
}

export class StorageQuotaError extends Error {}

// --- Seeding ---

export function ensureSeeded(): void {
  if (typeof window === 'undefined') return;
  // Versioned seeding: bump the version when the seed schema changes so
  // existing browsers pick up the new data.
  const SEED_VERSION = '2';
  if (window.localStorage.getItem(KEYS.seeded) === SEED_VERSION) return;
  write(KEYS.users, SEED_USERS);
  write(KEYS.products, SEED_PRODUCTS);
  write(KEYS.conversations, SEED_CONVERSATIONS);
  write(KEYS.messages, SEED_MESSAGES);
  write(KEYS.transactions, SEED_TRANSACTIONS);
  window.localStorage.setItem(KEYS.seeded, SEED_VERSION);
}

// --- Users ---

export function getUsers(): User[] {
  return read<User[]>(KEYS.users, []);
}

export function saveUsers(users: User[]): void {
  write(KEYS.users, users);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

export function upsertUser(user: User): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  saveUsers(users);
}

// --- Current session ---

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEYS.currentUserId);
}

export function setCurrentUserId(id: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEYS.currentUserId, id);
}

export function clearCurrentUserId(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEYS.currentUserId);
}

// --- OTP (transient) ---

export type OtpRecord = { code: string; email: string; expiresAt: number };

export function getOtp(): OtpRecord | null {
  return read<OtpRecord | null>(KEYS.otp, null);
}

export function setOtp(record: OtpRecord): void {
  write(KEYS.otp, record);
}

export function clearOtp(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEYS.otp);
}

// --- Products ---

export function getProducts(): Product[] {
  return read<Product[]>(KEYS.products, []);
}

export function saveProducts(products: Product[]): void {
  write(KEYS.products, products);
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function upsertProduct(product: Product): void {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) products[idx] = product;
  else products.push(product);
  saveProducts(products);
}

export function deleteProduct(id: string): void {
  saveProducts(getProducts().filter((p) => p.id !== id));
  // Cascade: remove all conversations and messages tied to this product so
  // orphaned data doesn't accumulate in localStorage.
  const convIds = getConversations()
    .filter((c) => c.productId === id)
    .map((c) => c.id);
  if (convIds.length > 0) {
    saveConversations(getConversations().filter((c) => c.productId !== id));
    saveMessages(getMessages().filter((m) => !convIds.includes(m.conversationId)));
  }
}

// --- Conversations ---

export function getConversations(): Conversation[] {
  return read<Conversation[]>(KEYS.conversations, []);
}

export function saveConversations(convs: Conversation[]): void {
  write(KEYS.conversations, convs);
}

export function getConversationById(id: string): Conversation | undefined {
  return getConversations().find((c) => c.id === id);
}

export function getConversationForProduct(
  productId: string,
  buyerId: string
): Conversation | undefined {
  return getConversations().find(
    (c) => c.productId === productId && c.buyerId === buyerId
  );
}

export function upsertConversation(conv: Conversation): void {
  const convs = getConversations();
  const idx = convs.findIndex((c) => c.id === conv.id);
  if (idx >= 0) convs[idx] = conv;
  else convs.push(conv);
  saveConversations(convs);
}

// --- Messages ---

export function getMessages(): Message[] {
  return read<Message[]>(KEYS.messages, []);
}

export function saveMessages(messages: Message[]): void {
  write(KEYS.messages, messages);
}

export function getMessagesForConversation(conversationId: string): Message[] {
  return getMessages()
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function appendMessage(message: Message): void {
  const messages = getMessages();
  messages.push(message);
  saveMessages(messages);
}

export function markConversationRead(
  conversationId: string,
  readerId: string
): boolean {
  const messages = getMessages();
  let changed = false;
  for (const m of messages) {
    if (m.conversationId === conversationId && m.senderId !== readerId && !m.isRead) {
      m.isRead = true;
      changed = true;
    }
  }
  if (changed) saveMessages(messages);
  return changed;
}

// --- Transactions ---

export function getTransactions(): Transaction[] {
  return read<Transaction[]>(KEYS.transactions, []);
}

export function saveTransactions(txs: Transaction[]): void {
  write(KEYS.transactions, txs);
}

export function upsertTransaction(tx: Transaction): void {
  const txs = getTransactions();
  const idx = txs.findIndex((t) => t.id === tx.id);
  if (idx >= 0) txs[idx] = tx;
  else txs.push(tx);
  saveTransactions(txs);
}

export function getTransactionForProduct(productId: string): Transaction | undefined {
  return getTransactions().find((t) => t.productId === productId);
}

// --- Favorites ---
// Stored as { [userId]: productId[] } so multiple users on the same browser
// each have their own independent favorites list.

export function getFavorites(userId: string): string[] {
  const all = read<Record<string, string[]>>(KEYS.favorites, {});
  return all[userId] ?? [];
}

export function isFavorite(userId: string, productId: string): boolean {
  return getFavorites(userId).includes(productId);
}

// Returns the new isFavorite state (true = added, false = removed).
export function toggleFavorite(userId: string, productId: string): boolean {
  const all = read<Record<string, string[]>>(KEYS.favorites, {});
  const list = all[userId] ?? [];
  const idx = list.indexOf(productId);
  if (idx >= 0) {
    all[userId] = list.filter((id) => id !== productId);
    write(KEYS.favorites, all);
    return false;
  } else {
    all[userId] = [...list, productId];
    write(KEYS.favorites, all);
    return true;
  }
}

// --- Ratings ---
// Stored as a flat list; each Rating ties to one transactionId so the
// "one rating per transaction" rule is enforced by hasRated().

export function getRatings(): Rating[] {
  return read<Rating[]>(KEYS.ratings, []);
}

export function getRatingsForSeller(sellerId: string): Rating[] {
  return getRatings().filter((r) => r.sellerId === sellerId);
}

// Returns undefined when the seller has no ratings yet → UI shows "Henüz değerlendirilmedi"
export function getSellerAverageRating(
  sellerId: string
): { average: number; count: number } | undefined {
  const list = getRatingsForSeller(sellerId);
  if (list.length === 0) return undefined;
  const sum = list.reduce((acc, r) => acc + r.score, 0);
  return { average: Math.round((sum / list.length) * 10) / 10, count: list.length };
}

// True if this buyer already rated this specific transaction.
export function hasRated(transactionId: string, buyerId: string): boolean {
  return getRatings().some(
    (r) => r.transactionId === transactionId && r.buyerId === buyerId
  );
}

export function addRating(rating: Rating): void {
  if (hasRated(rating.transactionId, rating.buyerId)) return; // idempotent guard
  const ratings = getRatings();
  ratings.push(rating);
  write(KEYS.ratings, ratings);
}

// --- ID generation ---

export function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// --- Cross-tab sync ---
// Subscribe to the window storage event so other tabs update live.
// Returns an unsubscribe function. Note: the storage event fires in OTHER tabs,
// not the one that made the change — so the mutating tab must also update its
// own React state directly.

export function onStorageChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key && e.key.startsWith('dd_')) cb();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
