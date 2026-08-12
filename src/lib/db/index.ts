import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import { initialProducts } from "@/data/initialProducts";
import { initialOrders, demoUser } from "@/data/initialOrders";

// ============================================================
// SQLite data layer — server-only.
// This is the single source of truth that the previous
// React-state / localStorage mock pretended to be.
// All access goes through the API routes -> `models.ts`.
// ============================================================

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "dasilva.db");

let _db: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  member_since TEXT NOT NULL,
  tier TEXT NOT NULL,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name_id TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_id TEXT NOT NULL,
  description_en TEXT NOT NULL,
  care_id TEXT NOT NULL,
  care_en TEXT NOT NULL,
  shipping_id TEXT NOT NULL,
  shipping_en TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price_idr INTEGER NOT NULL,
  is_limited INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_sold_out INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_id TEXT NOT NULL,
  alt_en TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  motif TEXT NOT NULL,
  batch_code TEXT NOT NULL,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  min_stock_threshold INTEGER NOT NULL DEFAULT 3
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  status TEXT NOT NULL,
  currency TEXT NOT NULL,
  subtotal REAL NOT NULL,
  shipping_cost REAL NOT NULL,
  duties_estimate REAL NOT NULL,
  total_amount REAL NOT NULL,
  shipping_address_json TEXT NOT NULL,
  shipping_method TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  tracking_number TEXT,
  is_3ds INTEGER NOT NULL DEFAULT 0,
  fraud_check_result TEXT NOT NULL DEFAULT 'n/a',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name_id TEXT NOT NULL,
  product_name_en TEXT NOT NULL,
  image_url TEXT,
  size TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  currency TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wishlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, product_id)
);
`;

function seed(db: Database.Database) {
  const productCount = (
    db.prepare("SELECT COUNT(*) AS c FROM products").get() as { c: number }
  ).c;
  if (productCount > 0) return;

  const insertProduct = db.prepare(
    `INSERT INTO products
      (id, name_id, name_en, description_id, description_en, care_id, care_en,
       shipping_id, shipping_en, category, base_price_idr, is_limited,
       is_active, is_sold_out, created_at)
     VALUES
      (@id, @name_id, @name_en, @description_id, @description_en, @care_id, @care_en,
       @shipping_id, @shipping_en, @category, @base_price_idr, @is_limited,
       @is_active, @is_sold_out, @created_at)`
  );
  const insertImage = db.prepare(
    `INSERT INTO product_images
      (id, product_id, image_url, alt_id, alt_en, is_primary, sort_order)
     VALUES (@id, @product_id, @image_url, @alt_id, @alt_en, @is_primary, @sort_order)`
  );
  const insertVariant = db.prepare(
    `INSERT INTO product_variants
      (id, product_id, size, motif, batch_code, stock_qty, min_stock_threshold)
     VALUES (@id, @product_id, @size, @motif, @batch_code, @stock_qty, @min_stock_threshold)`
  );
  const insertUser = db.prepare(
    `INSERT OR IGNORE INTO users
      (id, email, name, role, member_since, tier, password_hash)
     VALUES (@id, @email, @name, @role, @member_since, @tier, @password_hash)`
  );
  const insertOrder = db.prepare(
    `INSERT INTO orders
      (id, user_id, user_email, status, currency, subtotal, shipping_cost,
       duties_estimate, total_amount, shipping_address_json, shipping_method,
       payment_method, payment_status, tracking_number, is_3ds,
       fraud_check_result, created_at, updated_at)
     VALUES
      (@id, @user_id, @user_email, @status, @currency, @subtotal, @shipping_cost,
       @duties_estimate, @total_amount, @shipping_address_json, @shipping_method,
       @payment_method, @payment_status, @tracking_number, @is_3ds,
       @fraud_check_result, @created_at, @updated_at)`
  );
  const insertOrderItem = db.prepare(
    `INSERT INTO order_items
      (id, order_id, product_id, product_name_id, product_name_en, image_url,
       size, qty, unit_price, currency)
     VALUES
      (@id, @order_id, @product_id, @product_name_id, @product_name_en, @image_url,
       @size, @qty, @unit_price, @currency)`
  );

  const seedAll = db.transaction(() => {
    insertUser.run({
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      role: demoUser.role,
      member_since: demoUser.memberSince,
      tier: demoUser.tier,
      password_hash: null,
    });

    for (const p of initialProducts) {
      insertProduct.run({
        id: p.id,
        name_id: p.name.id,
        name_en: p.name.en,
        description_id: p.description.id,
        description_en: p.description.en,
        care_id: p.care.id,
        care_en: p.care.en,
        shipping_id: p.shipping.id,
        shipping_en: p.shipping.en,
        category: p.category,
        base_price_idr: p.basePriceIdr,
        is_limited: p.isLimited ? 1 : 0,
        is_active: p.isActive ? 1 : 0,
        is_sold_out: p.isSoldOut ? 1 : 0,
        created_at: p.createdAt,
      });
      for (const img of p.images) {
        insertImage.run({
          id: img.id,
          product_id: p.id,
          image_url: img.url,
          alt_id: img.alt.id,
          alt_en: img.alt.en,
          is_primary: img.isPrimary ? 1 : 0,
          sort_order: img.sortOrder,
        });
      }
      for (const v of p.variants) {
        insertVariant.run({
          id: v.id,
          product_id: p.id,
          size: v.size,
          motif: v.motif,
          batch_code: v.batchCode,
          stock_qty: v.stockQty,
          min_stock_threshold: v.minStockThreshold,
        });
      }
    }

    for (const o of initialOrders) {
      insertOrder.run({
        id: o.id,
        user_id: o.userId,
        user_email: o.userEmail,
        status: o.status,
        currency: o.currency,
        subtotal: o.subtotal,
        shipping_cost: o.shippingCost,
        duties_estimate: o.dutiesEstimate,
        total_amount: o.totalAmount,
        shipping_address_json: JSON.stringify(o.shippingAddress),
        shipping_method: o.shippingMethod,
        payment_method: o.paymentMethod,
        payment_status: o.paymentStatus,
        tracking_number: o.trackingNumber,
        is_3ds: o.is3ds ? 1 : 0,
        fraud_check_result: o.fraudCheckResult,
        created_at: o.createdAt,
        updated_at: o.updatedAt,
      });
      for (const it of o.items) {
        insertOrderItem.run({
          id: it.id,
          order_id: o.id,
          product_id: it.productId,
          product_name_id: it.productName.id,
          product_name_en: it.productName.en,
          image_url: it.imageUrl,
          size: it.size,
          qty: it.qty,
          unit_price: it.unitPrice,
          currency: it.currency,
        });
      }
    }
  });

  seedAll();
}

function init(): Database.Database {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  seed(db);
  return db;
}

export function getDb(): Database.Database {
  if (!_db) _db = init();
  return _db;
}
