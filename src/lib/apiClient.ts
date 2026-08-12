// Thin client-side fetch wrapper for the JSON API.
// Keeps every frontend call consistent and error-tolerant.

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getProducts: () => request<ProductList>("/api/products"),
  getProduct: (id: string) => request<Product>("/api/products/" + encodeURIComponent(id)),
  createProduct: (payload: ProductPayload) =>
    request<Product>("/api/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id: string, payload: Partial<ProductPayload>) =>
    request<Product>("/api/products/" + encodeURIComponent(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: string) =>
    request<{ ok: true }>("/api/products/" + encodeURIComponent(id), { method: "DELETE" }),

  getOrders: () => request<Order[]>("/api/orders"),
  createOrder: (payload: NewOrderPayload) =>
    request<Order>("/api/orders", { method: "POST", body: JSON.stringify(payload) }),
  updateOrderStatus: (id: string, status: string) =>
    request<Order>("/api/orders/" + encodeURIComponent(id) + "/status", {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  setTracking: (id: string, trackingNumber: string) =>
    request<Order>("/api/orders/" + encodeURIComponent(id) + "/tracking", {
      method: "PATCH",
      body: JSON.stringify({ trackingNumber }),
    }),

  getWishlist: (userId: string) =>
    request<WishlistItem[]>("/api/wishlist?userId=" + encodeURIComponent(userId)),
  addWishlist: (userId: string, productId: string) =>
    request<{ ok: true }>("/api/wishlist", {
      method: "POST",
      body: JSON.stringify({ userId, productId }),
    }),
  removeWishlist: (userId: string, productId: string) =>
    request<{ ok: true }>(
      "/api/wishlist?userId=" + encodeURIComponent(userId) + "&productId=" + encodeURIComponent(productId),
      { method: "DELETE" }
    ),

  signIn: (email: string) =>
    request<User>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};

// ---- payload/response shapes (client view) ----
import type {
  CartItem,
  Currency,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ShippingAddress,
  User,
  WishlistItem,
} from "@/lib/types";

type ProductList = Product[];
type ProductPayload = {
  nameId: string;
  nameEn: string;
  descId: string;
  descEn: string;
  category: Product["category"];
  basePriceIdr: number;
  isLimited: boolean;
  isActive: boolean;
  imageUrl: string;
  sizes: { size: string; stock: number }[];
};
type NewOrderPayload = {
  cart: CartItem[];
  productsSnapshot: Product[];
  shippingAddress: ShippingAddress;
  shippingMethod: "standard" | "express";
  paymentMethod: PaymentMethod;
  currency: Currency;
  subtotal: number;
  shippingCost: number;
  dutiesEstimate: number;
  is3ds: boolean;
  activeUserId: string | null;
};
