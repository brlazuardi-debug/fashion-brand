import { getDb } from "./index";
import { EXCHANGE_RATES } from "@/lib/currency";
import type {
  CartItem,
  Currency,
  Locale,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductImage,
  ProductVariant,
  ShippingAddress,
  User,
  WishlistItem,
} from "@/lib/types";

// ============================================================
// Data models — clean mapping between SQLite rows and the
// domain types consumed across the UI. This is the only place
// that touches SQL; pages/components never see a raw row.
// ============================================================

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

// ---------- Row mappers ----------

interface ProductRow {
  id: string;
  name_id: string;
  name_en: string;
  description_id: string;
  description_en: string;
  care_id: string;
  care_en: string;
  shipping_id: string;
  shipping_en: string;
  category: Product["category"];
  base_price_idr: number;
  is_limited: number;
  is_active: number;
  is_sold_out: number;
  created_at: string;
}

function mapProduct(p: ProductRow, images: ProductImage[], variants: ProductVariant[]): Product {
  return {
    id: p.id,
    name: { id: p.name_id, en: p.name_en },
    description: { id: p.description_id, en: p.description_en },
    care: { id: p.care_id, en: p.care_en },
    shipping: { id: p.shipping_id, en: p.shipping_en },
    category: p.category,
    basePriceIdr: p.base_price_idr,
    isLimited: !!p.is_limited,
    isActive: !!p.is_active,
    isSoldOut: !!p.is_sold_out,
    createdAt: p.created_at,
    images,
    variants,
  };
}

function loadImages(db: import("better-sqlite3").Database, productId: string): ProductImage[] {
  const rows = db
    .prepare(
      "SELECT id, image_url, alt_id, alt_en, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC"
    )
    .all(productId) as {
    id: string;
    image_url: string;
    alt_id: string;
    alt_en: string;
    is_primary: number;
    sort_order: number;
  }[];
  return rows.map((r) => ({
    id: r.id,
    url: r.image_url,
    alt: { id: r.alt_id, en: r.alt_en },
    isPrimary: !!r.is_primary,
    sortOrder: r.sort_order,
  }));
}

function loadVariants(db: import("better-sqlite3").Database, productId: string): ProductVariant[] {
  const rows = db
    .prepare(
      "SELECT id, size, motif, batch_code, stock_qty, min_stock_threshold FROM product_variants WHERE product_id = ? ORDER BY size ASC"
    )
    .all(productId) as {
    id: string;
    size: string;
    motif: string;
    batch_code: string;
    stock_qty: number;
    min_stock_threshold: number;
  }[];
  return rows.map((r) => ({
    id: r.id,
    size: r.size,
    motif: r.motif,
    batchCode: r.batch_code,
    stockQty: r.stock_qty,
    minStockThreshold: r.min_stock_threshold,
  }));
}

// ---------- Products ----------

export function getAllProducts(): Product[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM products ORDER BY created_at DESC")
    .all() as ProductRow[];
  return rows.map((p) => mapProduct(p, loadImages(db, p.id), loadVariants(db, p.id)));
}

export function getProduct(id: string): Product | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as
    | ProductRow
    | undefined;
  if (!row) return undefined;
  return mapProduct(row, loadImages(db, id), loadVariants(db, id));
}

export interface ProductInput {
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
}

export function createProduct(input: ProductInput): Product {
  const db = getDb();
  const id = uid("prod");
  const totalStock = input.sizes.reduce((s, x) => s + Math.max(0, x.stock), 0);
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO products
        (id, name_id, name_en, description_id, description_en, care_id, care_en,
         shipping_id, shipping_en, category, base_price_idr, is_limited,
         is_active, is_sold_out, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.nameId,
      input.nameEn,
      input.descId,
      input.descEn,
      "Lihat deskripsi produk.",
      "See product description.",
      "Dikirim dalam 3–5 hari kerja.",
      "Ships in 3–5 business days.",
      input.category,
      input.basePriceIdr,
      input.isLimited ? 1 : 0,
      input.isActive ? 1 : 0,
      totalStock <= 0 ? 1 : 0,
      now
    );
    db.prepare(
      `INSERT INTO product_images
        (id, product_id, image_url, alt_id, alt_en, is_primary, sort_order)
       VALUES (?, ?, ?, ?, ?, 1, 0)`
    ).run(uid("img"), id, input.imageUrl, input.nameId, input.nameEn);
    const insVar = db.prepare(
      `INSERT INTO product_variants
        (id, product_id, size, motif, batch_code, stock_qty, min_stock_threshold)
       VALUES (?, ?, ?, ?, ?, ?, 3)`
    );
    input.sizes.forEach((s) => {
      insVar.run(uid("var"), id, s.size, input.nameEn, `B-${Math.floor(1000 + Math.random() * 9000)}`, Math.max(0, s.stock));
    });
  });
  tx();
  return getProduct(id)!;
}

export function updateProduct(
  id: string,
  patch: Partial<{
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
  }>
): Product | undefined {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as
    | ProductRow
    | undefined;
  if (!existing) return undefined;

  const nameId = patch.nameId ?? existing.name_id;
  const nameEn = patch.nameEn ?? existing.name_en;
  const descId = patch.descId ?? existing.description_id;
  const descEn = patch.descEn ?? existing.description_en;
  const category = patch.category ?? existing.category;
  const price = patch.basePriceIdr ?? existing.base_price_idr;
  const isLimited = patch.isLimited ?? !!existing.is_limited;
  const isActive = patch.isActive ?? !!existing.is_active;

  const tx = db.transaction(() => {
    let totalStock = loadVariants(db, id).reduce((s, v) => s + v.stockQty, 0);
    if (patch.sizes) {
      db.prepare("DELETE FROM product_variants WHERE product_id = ?").run(id);
      const insVar = db.prepare(
        `INSERT INTO product_variants
          (id, product_id, size, motif, batch_code, stock_qty, min_stock_threshold)
         VALUES (?, ?, ?, ?, ?, ?, 3)`
      );
      patch.sizes.forEach((s) => {
        insVar.run(uid("var"), id, s.size, nameEn, `B-${Math.floor(1000 + Math.random() * 9000)}`, Math.max(0, s.stock));
      });
      totalStock = patch.sizes.reduce((s, x) => s + Math.max(0, x.stock), 0);
    }
    const isSoldOut = totalStock <= 0 ? 1 : 0;
    const active = totalStock <= 0 ? 0 : isActive ? 1 : 0;

    db.prepare(
      `UPDATE products SET
        name_id = ?, name_en = ?, description_id = ?, description_en = ?,
        category = ?, base_price_idr = ?, is_limited = ?, is_active = ?,
        is_sold_out = ?
       WHERE id = ?`
    ).run(
      nameId,
      nameEn,
      descId,
      descEn,
      category,
      price,
      isLimited ? 1 : 0,
      active,
      isSoldOut,
      id
    );

    if (patch.imageUrl) {
      db.prepare(
        `UPDATE product_images SET image_url = ?, alt_id = ?, alt_en = ? WHERE product_id = ? AND is_primary = 1`
      ).run(patch.imageUrl, nameId, nameEn, id);
    }
  });
  tx();
  return getProduct(id);
}

export function deleteProduct(id: string): void {
  const db = getDb();
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
}

// INV-1 / INV-2: adjust a single variant's stock; recompute sold-out + low-stock alerts.
export function updateStock(productId: string, variantId: string, qty: number): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare("UPDATE product_variants SET stock_qty = ? WHERE id = ? AND product_id = ?").run(
      Math.max(0, qty),
      variantId,
      productId
    );
    const total = (
      db.prepare("SELECT COALESCE(SUM(stock_qty),0) AS t FROM product_variants WHERE product_id = ?").get(productId) as {
        t: number;
      }
    ).t;
    db.prepare("UPDATE products SET is_sold_out = ?, is_active = CASE WHEN ? <= 0 THEN 0 ELSE is_active END WHERE id = ?").run(
      total <= 0 ? 1 : 0,
      total,
      productId
    );
  });
  tx();
}

// ---------- Orders ----------

interface OrderRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  status: OrderStatus;
  currency: Currency;
  subtotal: number;
  shipping_cost: number;
  duties_estimate: number;
  total_amount: number;
  shipping_address_json: string;
  shipping_method: "standard" | "express";
  payment_method: PaymentMethod;
  payment_status: string;
  tracking_number: string | null;
  is_3ds: number;
  fraud_check_result: string;
  created_at: string;
  updated_at: string;
}

function mapOrder(o: OrderRow): Order {
  return {
    id: o.id,
    userId: o.user_id,
    userEmail: o.user_email,
    status: o.status,
    currency: o.currency,
    items: getOrderItems(o.id),
    subtotal: o.subtotal,
    shippingCost: o.shipping_cost,
    dutiesEstimate: o.duties_estimate,
    totalAmount: o.total_amount,
    shippingAddress: JSON.parse(o.shipping_address_json) as ShippingAddress,
    shippingMethod: o.shipping_method,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status as Order["paymentStatus"],
    trackingNumber: o.tracking_number,
    is3ds: !!o.is_3ds,
    fraudCheckResult: (o.fraud_check_result as Order["fraudCheckResult"]) ?? "n/a",
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

function getOrderItems(orderId: string): Order["items"] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, product_id, product_name_id, product_name_en, image_url, size, qty, unit_price, currency FROM order_items WHERE order_id = ?"
    )
    .all(orderId) as {
    id: string;
    product_id: string | null;
    product_name_id: string;
    product_name_en: string;
    image_url: string | null;
    size: string;
    qty: number;
    unit_price: number;
    currency: Currency;
  }[];
  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id ?? "",
    productName: { id: r.product_name_id, en: r.product_name_en },
    imageUrl: r.image_url ?? "",
    size: r.size,
    qty: r.qty,
    unitPrice: r.unit_price,
    currency: r.currency,
  }));
}

export function getAllOrders(): Order[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC")
    .all() as OrderRow[];
  return rows.map(mapOrder);
}

export function getOrder(id: string): Order | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as
    | OrderRow
    | undefined;
  return row ? mapOrder(row) : undefined;
}

export interface NewOrderInput {
  cart: CartItem[];
  productsSnapshot: Product[]; // resolved product list for prices/names
  shippingAddress: ShippingAddress;
  shippingMethod: "standard" | "express";
  paymentMethod: PaymentMethod;
  currency: Currency;
  subtotal: number; // in currency
  shippingCost: number; // in currency
  dutiesEstimate: number; // in currency
  is3ds: boolean;
  fraudCheckResult: "pass" | "review" | "fail";
  activeUserId: string | null;
}

export function createOrder(input: NewOrderInput): Order {
  const db = getDb();
  const id = `DB-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  )}`;
  const now = new Date().toISOString();
  const rateForCurrency = input.currency;

  // fraud detection (PAY-5): large international orders flagged for review.
  const fraudCheckResult: "pass" | "review" | "fail" =
    input.shippingAddress.country === "NG" || input.shippingAddress.country === "RU"
      ? "fail"
      : input.subtotal / (EXCHANGE_RATES[input.currency] || 1) > 80000000
      ? "review"
      : "pass";

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO orders
        (id, user_id, user_email, status, currency, subtotal, shipping_cost,
         duties_estimate, total_amount, shipping_address_json, shipping_method,
         payment_method, payment_status, tracking_number, is_3ds,
         fraud_check_result, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.activeUserId,
      input.shippingAddress.email,
      "Menunggu Diproses",
      input.currency,
      input.subtotal,
      input.shippingCost,
      input.dutiesEstimate,
      input.subtotal + input.shippingCost + input.dutiesEstimate,
      JSON.stringify(input.shippingAddress),
      input.shippingMethod,
      input.paymentMethod,
      "paid",
      null,
      input.is3ds ? 1 : 0,
      fraudCheckResult,
      now,
      now
    );

    const insItem = db.prepare(
      `INSERT INTO order_items
        (id, order_id, product_id, product_name_id, product_name_en, image_url,
         size, qty, unit_price, currency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const item of input.cart) {
      const product = input.productsSnapshot.find((p) => p.id === item.productId);
      if (!product) continue;
      const unitPrice = Math.round(product.basePriceIdr * currencyRateFor(rateForCurrency));
      insItem.run(
        uid("oi"),
        id,
        product.id,
        product.name.id,
        product.name.en,
        product.images[0]?.url ?? "",
        item.size,
        item.qty,
        unitPrice,
        rateForCurrency
      );
      // decrement stock for the chosen variant
      db.prepare(
        `UPDATE product_variants SET stock_qty = MAX(0, stock_qty - ?)
         WHERE product_id = ? AND size = ?`
      ).run(item.qty, product.id, item.size);
    }
    // recompute sold-out for affected products
    const affected = input.cart.map((c) => c.productId);
    for (const pid of affected) {
      const total = (
        db.prepare("SELECT COALESCE(SUM(stock_qty),0) AS t FROM product_variants WHERE product_id = ?").get(pid) as {
          t: number;
        }
      ).t;
      db.prepare("UPDATE products SET is_sold_out = ?, is_active = CASE WHEN ? <= 0 THEN 0 ELSE is_active END WHERE id = ?").run(
        total <= 0 ? 1 : 0,
        total,
        pid
      );
    }
  });
  tx();
  return getOrder(id)!;
}

export function updateOrderStatus(orderId: string, status: OrderStatus): void {
  const db = getDb();
  db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(
    status,
    new Date().toISOString(),
    orderId
  );
}

export function setTrackingNumber(orderId: string, tracking: string): void {
  const db = getDb();
  db.prepare("UPDATE orders SET tracking_number = ?, updated_at = ? WHERE id = ?").run(
    tracking,
    new Date().toISOString(),
    orderId
  );
}

// ---------- Wishlist ----------

export function getWishlist(userId: string): WishlistItem[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT product_id, created_at FROM wishlist WHERE user_id = ?")
    .all(userId) as { product_id: string; created_at: string }[];
  return rows.map((r) => ({ productId: r.product_id, createdAt: r.created_at }));
}

export function addToWishlist(userId: string, productId: string): void {
  const db = getDb();
  db.prepare(
    "INSERT OR IGNORE INTO wishlist (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)"
  ).run(uid("wish"), userId, productId, new Date().toISOString());
}

export function removeFromWishlist(userId: string, productId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?").run(userId, productId);
}

// ---------- Users / Auth ----------

export function getUserByEmail(email: string): User | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | {
        id: string;
        email: string;
        name: string;
        role: User["role"];
        member_since: string;
        tier: string;
      }
    | undefined;
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    memberSince: row.member_since,
    tier: row.tier,
  };
}

export function upsertDemoUser(email: string): User {
  const db = getDb();
  let user = getUserByEmail(email);
  if (!user) {
    const name = email.split("@")[0];
    const id = uid("user");
    db.prepare(
      "INSERT OR IGNORE INTO users (id, email, name, role, member_since, tier, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, email, name, "customer", String(new Date().getFullYear()), "ARTISAN TIER", null);
    user = getUserByEmail(email)!;
  }
  return user;
}

// ---------- Helpers ----------

function currencyRateFor(c: Currency): number {
  return EXCHANGE_RATES[c];
}
