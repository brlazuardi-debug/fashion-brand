"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Tags,
  ShoppingCart,
  Boxes,
  BarChart,
  Bell,
  LogOut,
  Plus,
  Edit,
  Delete,
  Download,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useT } from "@/lib/useT";
import { formatPrice, EXCHANGE_RATES } from "@/lib/currency";
import { statusLabel } from "@/lib/i18n";
import ProductForm, { type ProductFormValues } from "@/components/admin/ProductForm";
import type { OrderStatus, Product } from "@/lib/types";

type Tab = "dashboard" | "catalog" | "orders" | "inventory" | "reports";

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  "Menunggu Pembayaran": "Menunggu Diproses",
  "Menunggu Diproses": "Diproses",
  Diproses: "Dikemas",
  Dikemas: "Dikirim",
  Dikirim: "Selesai",
  Selesai: null,
  Dibatalkan: null,
};

export default function AdminPage() {
  const { t, language } = useT();
  const {
    products,
    orders,
    currency,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    setTrackingNumber,
    updateStock,
  } = useStore();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [trackingInput, setTrackingInput] = useState<Record<string, string>>({});

  // Revenue in IDR: convert each paid order's total back to IDR base.
  const revenueIdr = useMemo(
    () =>
      orders
        .filter((o) => o.paymentStatus === "paid")
        .reduce((s, o) => s + o.totalAmount / EXCHANGE_RATES[o.currency], 0),
    [orders]
  );
  const activeOrders = orders.filter(
    (o) => o.status === "Diproses" || o.status === "Dikemas" || o.status === "Menunggu Diproses"
  ).length;
  const lowStock = useMemo(
    () =>
      products
        .map((p) => ({
          p,
          total: p.variants.reduce((s, v) => s + v.stockQty, 0),
          low: p.variants.some((v) => v.stockQty <= v.minStockThreshold),
        }))
        .filter((x) => x.low),
    [products]
  );
  const newCustomers = 48;

  // Top motifs (by aggregate stock as proxy for sales volume in demo)
  const topMotifs = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) =>
      p.variants.forEach((v) => {
        const name = p.name.en;
        map.set(name, (map.get(name) ?? 0) + v.stockQty);
      })
    );
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((e) => e[0]);
  }, [products]);

  // ---- CSV export (RPT-3) ----
  const exportCsv = () => {
    const header = [
      "Order ID",
      "Date",
      "Customer",
      "Currency",
      "Subtotal",
      "Shipping",
      "Duties",
      "Total",
      "Status",
    ];
    const rows = orders.map((o) => [
      o.id,
      o.createdAt.slice(0, 10),
      o.userEmail ?? "",
      o.currency,
      o.subtotal,
      o.shippingCost,
      o.dutiesEstimate,
      o.totalAmount,
      statusLabel(o.status, language),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dasilva-batik-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setShowForm(true);
  };

  const handleSave = (values: ProductFormValues) => {
    const imgs = [
      {
        id: `img-${Math.random().toString(36).slice(2, 8)}`,
        url: values.imageUrl,
        alt: { id: values.nameId, en: values.nameEn },
        isPrimary: true,
        sortOrder: 0,
      },
    ];
    const variants = values.sizes.map((s, i) => ({
      id: `var-${Math.random().toString(36).slice(2, 8)}-${i}`,
      size: s.size,
      motif: values.nameEn,
      batchCode: `B-${Math.floor(1000 + Math.random() * 9000)}`,
      stockQty: Math.max(0, s.stock),
      minStockThreshold: 3,
    }));
    const total = variants.reduce((s, v) => s + v.stockQty, 0);

    if (editing) {
      updateProduct(editing.id, {
        name: { id: values.nameId, en: values.nameEn },
        description: { id: values.descId, en: values.descEn },
        category: values.category,
        basePriceIdr: values.basePriceIdr,
        isLimited: values.isLimited,
        isActive: values.isActive,
        isSoldOut: total <= 0,
        images: imgs,
        variants,
      });
    } else {
      addProduct({
        name: { id: values.nameId, en: values.nameEn },
        description: { id: values.descId, en: values.descEn },
        care: { id: "Lihat deskripsi produk.", en: "See product description." },
        shipping: { id: "Dikirim 3–5 hari kerja.", en: "Ships in 3–5 days." },
        category: values.category,
        basePriceIdr: values.basePriceIdr,
        isLimited: values.isLimited,
        isActive: values.isActive,
        isSoldOut: total <= 0,
        images: imgs,
        variants,
      });
    }
    setShowForm(false);
    setEditing(null);
  };

  const confirmDeleteProduct = () => {
    if (confirmDelete) deleteProduct(confirmDelete.id);
    setConfirmDelete(null);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactElement }[] = [
    { id: "dashboard", label: t("admin.dashboard"), icon: <LayoutDashboard fontSize="medium" /> },
    { id: "catalog", label: t("admin.catalog"), icon: <Tags fontSize="medium" /> },
    { id: "orders", label: t("admin.orders"), icon: <ShoppingCart fontSize="medium" /> },
    { id: "inventory", label: t("admin.inventory"), icon: <Boxes fontSize="medium" /> },
    { id: "reports", label: t("admin.reports"), icon: <BarChart fontSize="medium" /> },
  ];

  return (
    <div className="pt-[72px] md:pt-[80px] flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-paper border-b md:border-b-0 md:border-r border-silver-subtle flex md:flex-col shrink-0 md:h-[calc(100vh-80px)] md:sticky md:top-[80px]">
        <div className="p-gutter border-b border-silver-subtle h-20 flex items-center justify-center">
          <h1 className="font-headline-md text-headline-md tracking-widest text-obsidian uppercase">
            {t("admin.title")}
          </h1>
        </div>
        <nav className="flex md:flex-col overflow-x-auto py-2 md:py-8">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`sidebar-link flex items-center px-gutter py-3 text-label-caps font-label-caps uppercase whitespace-nowrap ${
                tab === tb.id
                  ? "text-obsidian bg-surface-container-high border-r-2 border-obsidian font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="mr-3 text-[20px]">{tb.icon}</span>
              {tb.label}
            </button>
          ))}
        </nav>
        <div className="hidden md:block p-gutter border-t border-silver-subtle mt-auto">
          <Link
            href="/"
            className="flex items-center text-on-surface-variant hover:text-obsidian transition-colors font-label-caps text-label-caps uppercase"
          >
            <LogOut fontSize="medium" className="mr-3" /> {t("admin.logout")}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-surface-container-low min-h-[calc(100vh-80px)]">
        <header className="h-20 bg-paper border-b border-silver-subtle flex items-center justify-between px-gutter sticky top-[72px] md:top-[80px] z-30">
          <h2 className="font-headline-sm text-headline-sm text-obsidian">
            {tabs.find((x) => x.id === tab)?.label}
          </h2>
          <div className="flex items-center space-x-6">
            <button className="text-on-surface-variant hover:text-obsidian relative">
              <Bell fontSize="medium" />
              {lowStock.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-bronze-accent" />
              )}
            </button>
            <div className="flex items-center space-x-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbPF8CuYcvah5F47cwnirHowthokKCe-FqpcsWFgDvd90FjWsDO7rAqLulvPbV1F6ghkBsEChuTgcdH7xfEV6CNu3VQF83ix2xJmNaSFgmU3IHJ7MKEIfgtibrg33O-k4JWT2v6LNxZlC9W8FCjVm8hwp8T1K_HiQiBAczdMr4vNEaZiBZ-4ypoFIR2chZV7VaExGIk_AMZZDyA35mhY_J5TTohO9ge2GrFqHASR8K1XGdEdUOHqaH"
                alt="Admin"
                className="w-10 h-10 object-cover grayscale"
              />
              <div className="hidden lg:block">
                <p className="font-label-caps text-label-caps text-obsidian">Admin User</p>
                <p className="font-body-md text-sm text-on-surface-variant">Master Crafter</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-gutter lg:p-margin-desktop">
          {tab === "dashboard" && (
            <DashboardView
              revenueIdr={revenueIdr}
              activeOrders={activeOrders}
              lowStock={lowStock.length}
              newCustomers={newCustomers}
              topMotifs={topMotifs}
              recentOrders={orders.slice(0, 5)}
              currency={currency}
              language={language}
              t={t}
              onGoOrders={() => setTab("orders")}
            />
          )}

          {tab === "catalog" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-sm text-headline-sm text-obsidian">
                  {products.length} {language === "id" ? "produk" : "products"}
                </h3>
                <button
                  onClick={openAdd}
                  className="bg-obsidian text-paper font-label-caps text-label-caps px-6 py-3 flex items-center gap-2 hover:bg-graphite"
                >
                  <Plus fontSize="small" /> {t("admin.addProduct")}
                </button>
              </div>
              <div className="bg-paper border border-silver-subtle overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-silver-subtle">
                      {["Product", "Category", "Price", "Status", ""].map((h) => (
                        <th
                          key={h}
                          className="py-4 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase font-normal"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-silver-subtle hover:bg-surface-container transition-colors"
                      >
                        <td className="py-4 px-4 flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images[0]?.url}
                            alt={p.name[language]}
                            className="w-10 h-14 object-cover"
                          />
                          <span className="font-body-md text-obsidian">
                            {p.name[language]}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-body-md text-on-surface-variant">
                          {p.category}
                        </td>
                        <td className="py-4 px-4 font-price-display text-sm text-obsidian">
                          {formatPrice(p.basePriceIdr, currency, language)}
                        </td>
                        <td className="py-4 px-4">
                          {p.isSoldOut || p.isActive === false ? (
                            <span className="inline-block px-3 py-1 border border-obsidian font-label-caps text-[10px] uppercase text-obsidian">
                              Sold Out
                            </span>
                          ) : p.isLimited ? (
                            <span className="inline-block px-3 py-1 border border-bronze-accent font-label-caps text-[10px] uppercase text-bronze-accent">
                              Limited
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-obsidian text-paper font-label-caps text-[10px] uppercase">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEdit(p)}
                              className="text-on-surface-variant hover:text-obsidian"
                              aria-label={t("admin.editProduct")}
                            >
                              <Edit fontSize="small" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(p)}
                              className="text-on-surface-variant hover:text-error"
                              aria-label={t("admin.delete")}
                            >
                              <Delete fontSize="small" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-sm text-headline-sm text-obsidian">
                  {orders.length} {language === "id" ? "pesanan" : "orders"}
                </h3>
                <button
                  onClick={exportCsv}
                  className="font-label-caps text-label-caps text-obsidian border border-obsidian px-5 py-2 hover:bg-obsidian hover:text-paper transition-colors flex items-center gap-2"
                >
                  <Download fontSize="small" /> {t("admin.export")}
                </button>
              </div>
              <div className="bg-paper border border-silver-subtle overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-silver-subtle">
                      {["Order", "Customer", "Total", "Status", "Tracking", ""].map((h) => (
                        <th
                          key={h}
                          className="py-4 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase font-normal"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-silver-subtle hover:bg-surface-container transition-colors align-top"
                      >
                        <td className="py-4 px-4 font-body-md text-obsidian">{o.id}</td>
                        <td className="py-4 px-4 font-body-md text-obsidian">
                          {o.userEmail ?? "—"}
                        </td>
                        <td className="py-4 px-4 font-price-display text-sm text-obsidian">
                          {o.totalAmount} {o.currency}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-block px-3 py-1 border border-obsidian font-label-caps text-[10px] uppercase text-obsidian">
                            {statusLabel(o.status, language)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <input
                            value={trackingInput[o.id] ?? o.trackingNumber ?? ""}
                            onChange={(e) =>
                              setTrackingInput((p) => ({ ...p, [o.id]: e.target.value }))
                            }
                            placeholder="GC-…"
                            className="border-b border-graphite bg-transparent w-32 font-body-md text-body-md text-obsidian focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              setTrackingNumber(
                                o.id,
                                trackingInput[o.id] ?? o.trackingNumber ?? ""
                              )
                            }
                            className="ml-2 font-label-caps text-label-caps text-bronze-accent hover:underline"
                          >
                            {language === "id" ? "Simpan" : "Save"}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          {NEXT_STATUS[o.status] && (
                            <button
                              onClick={() =>
                                updateOrderStatus(o.id, NEXT_STATUS[o.status]!)
                              }
                              className="font-label-caps text-label-caps bg-obsidian text-paper px-3 py-2 hover:bg-graphite whitespace-nowrap"
                            >
                              {language === "id" ? "Lanjut" : "Advance"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "inventory" && (
            <div>
              <h3 className="font-headline-sm text-headline-sm text-obsidian mb-6">
                {language === "id" ? "Stok per Varian" : "Stock per Variant"}
              </h3>
              <div className="bg-paper border border-silver-subtle overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-silver-subtle">
                      {["Product", "Variant", "Stock", ""].map((h) => (
                        <th
                          key={h}
                          className="py-4 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase font-normal"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.flatMap((p) =>
                      p.variants.map((v) => (
                        <tr
                          key={v.id}
                          className="border-b border-silver-subtle hover:bg-surface-container"
                        >
                          <td className="py-4 px-4 font-body-md text-obsidian">
                            {p.name[language]}
                          </td>
                          <td className="py-4 px-4 font-body-md text-on-surface-variant">
                            {v.size} · {v.batchCode}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`font-price-display text-sm ${
                                v.stockQty <= v.minStockThreshold
                                  ? "text-error"
                                  : "text-obsidian"
                              }`}
                            >
                              {v.stockQty}
                            </span>
                          </td>
                          <td className="py-4 px-4 w-40">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateStock(p.id, v.id, v.stockQty - 1)
                                }
                                className="w-7 h-7 border border-graphite flex items-center justify-center hover:bg-surface-container"
                              >
                                –
                              </button>
                              <button
                                onClick={() =>
                                  updateStock(p.id, v.id, v.stockQty + 1)
                                }
                                className="w-7 h-7 border border-graphite flex items-center justify-center hover:bg-surface-container"
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "reports" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-sm text-headline-sm text-obsidian">
                  {language === "id" ? "Laporan Penjualan" : "Sales Reports"}
                </h3>
                <button
                  onClick={exportCsv}
                  className="font-label-caps text-label-caps text-obsidian border border-obsidian px-5 py-2 hover:bg-obsidian hover:text-paper transition-colors flex items-center gap-2"
                >
                  <Download fontSize="small" /> {t("admin.export")}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-paper p-6 border border-silver-subtle">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                    {t("admin.kpi.revenue")}
                  </span>
                  <p className="font-headline-md text-headline-md text-obsidian mt-2">
                    {formatPrice(revenueIdr, currency, language)}
                  </p>
                </div>
                <div className="bg-paper p-6 border border-silver-subtle">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                    {t("admin.kpi.orders")}
                  </span>
                  <p className="font-headline-md text-headline-md text-obsidian mt-2">
                    {orders.length}
                  </p>
                </div>
                <div className="bg-paper p-6 border border-silver-subtle">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                    {t("admin.kpi.alerts")}
                  </span>
                  <p className="font-headline-md text-headline-md text-error mt-2">
                    {lowStock.length}
                  </p>
                </div>
              </div>
              <div className="bg-paper p-6 border border-silver-subtle">
                <h4 className="font-headline-sm text-headline-sm text-obsidian mb-4">
                  {t("admin.topMotifs")}
                </h4>
                <div className="space-y-4">
                  {topMotifs.length === 0 && (
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {t("admin.noAlerts")}
                    </p>
                  )}
                  {topMotifs.map((m, i) => (
                    <div key={m} className="flex justify-between items-center">
                      <span className="font-body-md text-obsidian">{m}</span>
                      <span className="font-price-display text-price-display text-obsidian">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Product form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-obsidian/50 px-margin-mobile"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-paper border border-silver-subtle p-8 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline-sm text-headline-sm text-obsidian mb-6">
              {editing ? t("admin.editProduct") : t("admin.addProduct")}
            </h3>
            <ProductForm
              initial={editing ?? undefined}
              onSave={handleSave}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-obsidian/50 px-margin-mobile"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-paper border border-silver-subtle p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-headline-sm text-headline-sm text-obsidian mb-4">
              {t("admin.delete")}?
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              {confirmDelete.name[language]}
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmDeleteProduct}
                className="flex-1 bg-error text-on-error font-label-caps text-label-caps py-3 hover:opacity-90"
              >
                {t("admin.delete")}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-8 font-label-caps text-label-caps text-on-surface-variant border border-silver-subtle py-3 hover:border-obsidian"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView({
  revenueIdr,
  activeOrders,
  lowStock,
  newCustomers,
  topMotifs,
  recentOrders,
  currency,
  language,
  t,
  onGoOrders,
}: any) {
  const kpis = [
    { label: t("admin.kpi.revenue"), value: formatPrice(revenueIdr, currency, language), sub: "+12.5%", accent: true },
    { label: t("admin.kpi.orders"), value: String(activeOrders), sub: "24 pending" },
    { label: t("admin.kpi.alerts"), value: String(lowStock), sub: "critical", error: true },
    { label: t("admin.kpi.customers"), value: String(newCustomers), sub: "+5.2%", accent: true },
  ];
  return (
    <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
      <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-paper p-6 border border-silver-subtle flex flex-col justify-between h-40"
          >
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                {k.label}
              </span>
            </div>
            <div>
              <p className="font-headline-md text-headline-md text-obsidian">{k.value}</p>
              <p
                className={`font-body-md text-sm mt-1 ${
                  k.error ? "text-error" : "text-bronze-accent"
                }`}
              >
                {k.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="md:col-span-8 bg-paper p-6 border border-silver-subtle min-h-[360px]">
        <h3 className="font-headline-sm text-headline-sm text-obsidian mb-8">
          {t("admin.kpi.revenue")}
        </h3>
        {/* CSS bar chart placeholder */}
        <div className="flex items-end gap-3 h-48 border-b border-silver-subtle">
          {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-surface-container-high"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-3 font-label-caps text-label-caps text-on-surface-variant">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>

      <div className="md:col-span-4 bg-paper p-6 border border-silver-subtle">
        <h3 className="font-headline-sm text-headline-sm text-obsidian mb-6">
          {t("admin.topMotifs")}
        </h3>
        <div className="space-y-6">
          {topMotifs.map((m: string, i: number) => (
            <div key={m} className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-surface-container overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpn8vOmTXCOxabi7x5zTlfDh75cQVo4W_1VLIAI9oREHsxMmaSaJRQhEq4RkfLv1jon3rTZANUBITDA0Uq4bKoV28cIO0f1f8iqMW-1D3cVyMntvwAamcllzqDgHD45lKsyL1gAhZiD4xcRFsjs5Td4k6a0hr2vcTNurx6GC79hDOtsYwLEmNBzxOACvheCRPcnejBcIHmze8gkhaQFc-gapsJHEtVOL26KU-0A1y_iUVzKnFRpjqT"
                  alt={m}
                  className="w-full h-full object-cover grayscale"
                />
              </div>
              <div className="flex-1">
                <p className="font-label-caps text-label-caps text-obsidian uppercase truncate">
                  {m}
                </p>
                <p className="font-body-md text-sm text-on-surface-variant">
                  {35 - i * 5} {language === "id" ? "terjual" : "sold"}
                </p>
              </div>
              <span className="font-price-display text-price-display text-obsidian">
                #{i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-12 bg-paper p-6 border border-silver-subtle overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline-sm text-headline-sm text-obsidian">
            {t("admin.recentOrders")}
          </h3>
          <button
            onClick={onGoOrders}
            className="font-label-caps text-label-caps text-obsidian border-b border-obsidian pb-1 uppercase hover:text-bronze-accent transition-colors"
          >
            {t("admin.viewAll")}
          </button>
        </div>
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-silver-subtle">
              {["Order ID", "Date", "Customer", "Amount", "Status"].map((h) => (
                <th
                  key={h}
                  className="py-4 px-4 font-label-caps text-label-caps text-on-surface-variant uppercase font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o: any) => (
              <tr
                key={o.id}
                className="border-b border-silver-subtle hover:bg-surface-container transition-colors"
              >
                <td className="py-4 px-4 font-body-md text-obsidian">{o.id}</td>
                <td className="py-4 px-4 font-body-md text-on-surface-variant">
                  {o.createdAt.slice(0, 10)}
                </td>
                <td className="py-4 px-4 font-body-md text-obsidian">
                  {o.userEmail ?? "—"}
                </td>
                <td className="py-4 px-4 font-price-display text-sm text-obsidian">
                  {o.totalAmount} {o.currency}
                </td>
                <td className="py-4 px-4">
                  <span className="inline-block px-3 py-1 border border-obsidian font-label-caps text-[10px] uppercase text-obsidian">
                    {statusLabel(o.status, language)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
