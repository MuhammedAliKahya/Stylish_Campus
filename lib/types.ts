// Stylish Campus — data model types.
// All collections are JSON-stringified in localStorage under the dd_* keys.

export type Role = 'student' | 'admin';

export type User = {
  id: string;
  email: string; // must end with .edu.tr
  fullName: string;
  department?: string;
  avatarUrl?: string; // base64 data URL or undefined
  role: Role;
  isBanned: boolean;
  createdAt: string; // ISO
};

export type Category =
  | 'Etek'
  | 'Elbise'
  | 'Pantolon'
  | 'Gömlek'
  | 'Kaban'
  | 'Mont'
  | 'Kazak'
  | 'Tişört'
  | 'Bluz'
  | 'Eşofman';

export type Condition = 'Sıfır' | 'Az Kullanılmış' | 'İyi' | 'İdare Eder';

export type ProductStatus = 'active' | 'reserved' | 'sold' | 'banned';

export type Product = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number; // TL
  category: Category;
  size?: string;
  condition: Condition;
  meetupLocation: string; // from CAMPUS_LOCATIONS
  status: ProductStatus;
  reservedBuyerId?: string; // only set while status === "reserved"
  images: string[]; // base64 data URLs, max 3, each ≤ ~150KB
  createdAt: string; // ISO
};

export type Conversation = {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string; // ISO
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string; // ISO
};

export type TransactionStatus = 'reserved' | 'seller_confirmed' | 'completed';

export type Transaction = {
  id: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  meetupLocation: string;
  status: TransactionStatus;
  createdAt: string; // ISO
};

export type Rating = {
  id: string;
  transactionId: string; // bir işleme tek puan kuralı buradan uygulanır
  productId: string;
  buyerId: string;
  sellerId: string;
  score: number; // 1-5
  createdAt: string; // ISO
};

export const CAMPUS_LOCATIONS = [
  'Merkez Kütüphane Önü',
  'Mühendislik Kantini',
  'A Kapısı Güvenlik',
  'Yemekhane Girişi',
  'Spor Salonu Önü',
] as const;

export const CATEGORIES: Category[] = [
  'Etek',
  'Elbise',
  'Pantolon',
  'Gömlek',
  'Kaban',
  'Mont',
  'Kazak',
  'Tişört',
  'Bluz',
  'Eşofman',
];

export const CONDITIONS: Condition[] = [
  'Sıfır',
  'Az Kullanılmış',
  'İyi',
  'İdare Eder',
];

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Tek Ebat'] as const;
