"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CartItem,
  Currency,
  Locale,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ShippingAddress,
  User,
  WishlistItem,
} from "@/lib/types";
import { EXCHANGE_RATES } from "@/lib/currency";
import { api } from "@/lib/apiClient";
import { demoUser } from "@/data/initialOrders";

// ============================================================
// Store Context — single source of truth for the UI.
// Now backed by a SQLite database through the JSON API.
// Cart + currency + language stay in React state (ephemeral /
// per-session), while products, orders, wishlist and users are
// loaded from and persisted to SQLite via /api/*.
//
// The public surface (method names + signatures) is unchanged so
// every page/component that already calls useStore() keeps working.
// ============================================================

// Basic fraud detection (PAY-5): large international orders flagged for review.
function fraudCheck(amountIdr: number, country: string): "pass" | "review" | "fail" {
  if (country === "NG" || country === "RU") return "fail";
  if (amountIdr > 80000000) return "review";
  return "pass";
}

const STORAGE_KEY = "dasilva-batik-prefs-v1";

function loadPrefs(): { currency: Currency; language: Locale } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export interface NewOrderInput {
  shippingAddress: ShippingAddress;
  shippingMethod: "standard" | "express";
  paymentMethod: PaymentMethod;
  currency: Currency;
  subtotal: number; // in currency
  shippingCost: number; // in currency
  dutiesEstimate: number; // in currency
  is3ds: boolean;
}

interface StoreContextValue {
  products: Product[];
  cart: CartItem[];
  wishlist: WishlistItem[];
  orders: Order[];
  currency: Currency;
  language: Locale;
  activeUser: User | null;
  exchangeRates: Record<Currency, number>;
  loading: boolean;
  cartOpen: boolean;
  toast: string | null;
  setCurrency: (c: Currency) => void;
  setLanguage: (l: Locale) => void;
  openCart: () => void;
  closeCart: () => void;
  showToast: (msg: string) => void;
  addProduct: (p: Omit<Product, "id" | "createdAt">) => Promise<Product>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (productId: string, variantId: string, qty: number) => Promise<void>;
  addToCart: (productId: string, size: string, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateCartQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotalIdr: number;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  moveWishlistToCart: (productId: string, size?: string) => void;
  createOrder: (input: NewOrderInput) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  setTrackingNumber: (orderId: string, tracking: string) => Promise<void>;
  signIn: (email?: string) => Promise<void>;
  signOut: () => void;
  getProduct: (id: string) => Product | undefined;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

function productPayloadFromProduct(p: Omit<Product, "id" | "createdAt">) {
  return {
    nameId: p.name.id,
    nameEn: p.name.en,
    descId: p.description.id,
    descEn: p.description.en,
    category: p.category,
    basePriceIdr: p.basePriceIdr,
    isLimited: p.isLimited,
    isActive: p.isActive !== false,
    imageUrl: p.images[0]?.url ?? "",
    sizes: p.variants.map((v) => ({ size: v.size, stock: v.stockQty })),
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const prefs = loadPrefs();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [currency, setCurrencyState] = useState<Currency>(prefs?.currency ?? "IDR");
  const [language, setLanguageState] = useState<Locale>(prefs?.language ?? "en");
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const toastTimer = useRef<number | null>(null);

  // ---- initial load from SQLite (via API) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          api.getProducts(),
          api.getOrders(),
        ]);
        if (cancelled) return;
        setProducts(productsRes);
        setOrders(ordersRes);
      } catch {
        // Fallback to seed data if the API is unreachable (should not happen).
        if (!cancelled) {
          const { initialProducts } = await import("@/data/initialProducts");
          const { initialOrders } = await import("@/data/initialOrders");
          setProducts(initialProducts);
          setOrders(initialOrders);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Remember currency + language (prefs only).
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ currency, language })
      );
    } catch {
      /* ignore */
    }
  }, [currency, language]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const setCurrency = useCallback((c: Currency) => setCurrencyState(c), []);
  const setLanguage = useCallback((l: Locale) => setLanguageState(l), []);

  // ---- Product CRUD (KTLG-1..4) ----
  const addProduct = useCallback(
    async (p: Omit<Product, "id" | "createdAt">): Promise<Product> => {
      const created = await api.createProduct(productPayloadFromProduct(p));
      setProducts((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateProduct = useCallback(
    async (id: string, patch: Partial<Product>): Promise<void> => {
      const payload: Record<string, unknown> = {};
      if (patch.name) {
        payload.nameId = patch.name.id;
        payload.nameEn = patch.name.en;
      }
      if (patch.description) {
        payload.descId = patch.description.id;
        payload.descEn = patch.description.en;
      }
      if (patch.category !== undefined) payload.category = patch.category;
      if (patch.basePriceIdr !== undefined) payload.basePriceIdr = patch.basePriceIdr;
      if (patch.isLimited !== undefined) payload.isLimited = patch.isLimited;
      if (patch.isActive !== undefined) payload.isActive = patch.isActive;
      if (patch.images) payload.imageUrl = patch.images[0]?.url ?? "";
      if (patch.variants)
        payload.sizes = patch.variants.map((v) => ({
          size: v.size,
          stock: v.stockQty,
        }));
      const updated = await api.updateProduct(id, payload);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    },
    []
  );

  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setWishlist((prev) => prev.filter((w) => w.productId !== id));
  }, []);

  const updateStock = useCallback(
    async (productId: string, variantId: string, qty: number): Promise<void> => {
      // optimistic update then persist
      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          if (p.id !== productId) return p;
          const variants = p.variants.map((v) =>
            v.id === variantId ? { ...v, stockQty: Math.max(0, qty) } : v
          );
          const total = variants.reduce((s, v) => s + v.stockQty, 0);
          return {
            ...p,
            variants,
            isSoldOut: total <= 0,
            isActive: total <= 0 ? false : p.isActive,
          };
        })
      );
      // refresh from server to stay authoritatively consistent
      const updated = await api.getProduct(productId);
      if (updated) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      }
    },
    []
  );

  // ---- Cart ----
  const cartSubtotalIdr = useMemo(() => {
    return cart.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return sum;
      return sum + product.basePriceIdr * item.qty;
    }, 0);
  }, [cart, products]);

  const cartCount = useMemo(
    () => cart.reduce((s, i) => s + i.qty, 0),
    [cart]
  );

  const addToCart = useCallback(
    (productId: string, size: string, qty = 1) => {
      setCart((prev) => {
        const key = `${productId}:${size}`;
        const existing = prev.find((i) => i.id === key);
        if (existing) {
          return prev.map((i) =>
            i.id === key ? { ...i, qty: i.qty + qty } : i
          );
        }
        return [...prev, { id: key, productId, size, qty }];
      });
      setCartOpen(true);
    },
    []
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateCartQty = useCallback((id: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i))
        .filter((i) => i.qty > 0)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // ---- Wishlist (CUST-4) ----
  const isWishlisted = useCallback(
    (productId: string) => wishlist.some((w) => w.productId === productId),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      const exists = wishlist.some((w) => w.productId === productId);
      const user = activeUser ?? demoUser;
      if (exists) {
        setWishlist((prev) => prev.filter((w) => w.productId !== productId));
        api.removeWishlist(user.id, productId).catch(() => {});
      } else {
        setWishlist((prev) => [
          ...prev,
          { productId, createdAt: new Date().toISOString() },
        ]);
        api.addWishlist(user.id, productId).catch(() => {});
      }
    },
    [wishlist, activeUser]
  );

  const moveWishlistToCart = useCallback(
    (productId: string, size = "ONE SIZE") => {
      const product = products.find((p) => p.id === productId);
      const available =
        product?.variants.find((v) => v.size === size && v.stockQty > 0)?.size ??
        product?.variants.find((v) => v.stockQty > 0)?.size;
      if (available) {
        addToCart(productId, available, 1);
        toggleWishlist(productId);
        showToast("Moved to bag");
      } else {
        showToast("Out of stock");
      }
    },
    [products, addToCart, toggleWishlist, showToast]
  );

  // ---- Orders ----
  const createOrder = useCallback(
    async (input: NewOrderInput): Promise<Order> => {
      const productsSnapshot = products;
      const fraud = fraudCheck(
        cartSubtotalIdr,
        input.shippingAddress.country
      );
      const order = await api.createOrder({
        cart,
        productsSnapshot,
        shippingAddress: input.shippingAddress,
        shippingMethod: input.shippingMethod,
        paymentMethod: input.paymentMethod,
        currency: input.currency,
        subtotal: input.subtotal,
        shippingCost: input.shippingCost,
        dutiesEstimate: input.dutiesEstimate,
        is3ds: input.is3ds,
        activeUserId: activeUser?.id ?? null,
      });
      setOrders((prev) => [order, ...prev]);
      // refresh products so reduced stock + sold-out flags are reflected
      const refreshed = await api.getProducts();
      setProducts(refreshed);
      clearCart();
      return order;
    },
    [cart, products, cartSubtotalIdr, activeUser, clearCart]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus): Promise<void> => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status, updatedAt: new Date().toISOString() }
            : o
        )
      );
      await api.updateOrderStatus(orderId, status).catch(() => {});
    },
    []
  );

  const setTrackingNumber = useCallback(
    async (orderId: string, tracking: string): Promise<void> => {
      await api.setTracking(orderId, tracking);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, trackingNumber: tracking, updatedAt: new Date().toISOString() }
            : o
        )
      );
    },
    []
  );

  // ---- Auth (ACCT-1) ----
  const signIn = useCallback(async (email?: string) => {
    const user = await api.signIn(email ?? "");
    setActiveUser(user);
    // scope wishlist to this user
    try {
      const list = await api.getWishlist(user.id);
      setWishlist(list);
    } catch {
      /* ignore */
    }
  }, []);

  const signOut = useCallback(() => {
    setActiveUser(null);
    setWishlist([]);
  }, []);

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  const value: StoreContextValue = {
    products,
    cart,
    wishlist,
    orders,
    currency,
    language,
    activeUser,
    exchangeRates: EXCHANGE_RATES,
    loading,
    cartOpen,
    toast,
    setCurrency,
    setLanguage,
    openCart,
    closeCart,
    showToast,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    cartCount,
    cartSubtotalIdr,
    toggleWishlist,
    isWishlisted,
    moveWishlistToCart,
    createOrder,
    updateOrderStatus,
    setTrackingNumber,
    signIn,
    signOut,
    getProduct,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
