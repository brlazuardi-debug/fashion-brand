// ============================================================
// Dasilva Batik — Core domain types
// Mirrors the PRD (section 8: High-Level Data Model)
// ============================================================

export type Locale = "id" | "en";
export type Currency = "IDR" | "USD" | "EUR";

export type Category = "Outerwear" | "Shirts" | "Dresses" | "Accessories";

export type OrderStatus =
  | "Menunggu Pembayaran" // Awaiting Payment
  | "Menunggu Diproses" // Awaiting Processing (paid)
  | "Diproses" // Processing
  | "Dikemas" // Packed
  | "Dikirim" // Shipped
  | "Selesai" // Completed
  | "Dibatalkan"; // Cancelled

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentMethod = "card" | "qris";

export type UserRole = "customer" | "admin" | "production";

export interface LocalizedString {
  id: string;
  en: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: LocalizedString;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  size: string; // S, M, L, XL, ONE SIZE
  motif: string; // batik motif name
  batchCode: string;
  stockQty: number;
  minStockThreshold: number;
}

export interface Product {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  care: LocalizedString;
  shipping: LocalizedString;
  category: Category;
  basePriceIdr: number; // base price in IDR (config: IDR base)
  isLimited: boolean;
  isActive: boolean; // false => "Sold Out" / hidden from catalog
  isSoldOut: boolean; // explicit sold-out flag
  createdAt: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface CartItem {
  id: string; // composite key: `${productId}:${size}`
  productId: string;
  size: string;
  qty: number;
}

export interface WishlistItem {
  productId: string;
  createdAt: string;
}

export interface ShippingAddress {
  email: string;
  firstName: string;
  lastName: string;
  country: string; // ISO code
  address: string;
  city: string;
  postal: string;
  phone?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: LocalizedString;
  imageUrl: string;
  size: string;
  qty: number;
  unitPrice: number; // in order currency
  currency: Currency;
}

export interface Order {
  id: string;
  userId: string | null;
  userEmail: string | null;
  status: OrderStatus;
  currency: Currency;
  items: OrderItem[];
  subtotal: number; // in currency
  shippingCost: number;
  dutiesEstimate: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  shippingMethod: "standard" | "express";
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  trackingNumber: string | null;
  is3ds: boolean;
  fraudCheckResult: "pass" | "review" | "fail" | "n/a";
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  memberSince: string;
  tier: string;
}

export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  updatedAt: string;
}

// Country shipping profile used by the duties/shipping calculator (ORD-3, PAY-2)
export interface CountryShippingProfile {
  code: string;
  name: LocalizedString;
  // multiplier applied to a base IDR goods value to estimate import duties+taxes
  dutyRate: number; // e.g. 0.075 => 7.5%
  // base international shipping cost in USD
  baseShippingUsd: number;
  region: string;
}
