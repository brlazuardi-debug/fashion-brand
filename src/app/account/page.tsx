"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Star, Truck, LogOut, ChevronRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useT } from "@/lib/useT";
import { formatCurrencyValue, EXCHANGE_RATES } from "@/lib/currency";
import { statusLabel } from "@/lib/i18n";

// ============================================================
// Customer Account — profile, order history + tracking,
// wishlist management, settings, sign in/out (ACCT-1..3, CUST-4).
// ============================================================
export default function AccountPage() {
  const { t, language } = useT();
  const {
    orders,
    activeUser,
    signIn,
    signOut,
    wishlist,
    products,
    moveWishlistToCart,
    toggleWishlist,
    currency,
  } = useStore();
  const [email, setEmail] = useState("");

  const userOrders = useMemo(
    () =>
      orders.filter(
        (o) => !activeUser || o.userEmail === activeUser.email
      ),
    [orders, activeUser]
  );

  const activeShipment = userOrders.find(
    (o) => o.status === "Dikirim" || o.status === "Diproses" || o.status === "Dikemas"
  );

  if (!activeUser) {
    return (
      <div className="pt-[120px] min-h-[70vh] max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center gap-6 text-center">
        <h1 className="font-headline-lg text-headline-lg text-obsidian">
          DASILVA BATIK
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
          {language === "id"
            ? "Masuk untuk melihat pesanan, wishlist, dan pelacakan pengiriman."
            : "Sign in to view orders, wishlist, and shipment tracking."}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            signIn(email || undefined);
          }}
          className="w-full max-w-sm space-y-4"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="field-input font-label-caps text-label-caps"
          />
          <button
            type="submit"
            className="w-full bg-obsidian text-paper font-label-caps text-label-caps py-4 hover:bg-graphite"
          >
            {t("account.signin")}
          </button>
        </form>
        <button
          onClick={() => signIn()}
          className="font-label-caps text-label-caps text-bronze-accent hover:underline"
        >
          {language === "id" ? "Masuk sebagai demo" : "Continue as demo"}
        </button>
      </div>
    );
  }

  return (
    <div className="pt-[80px] pb-[80px] md:pb-0 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
      {/* Profile header */}
      <section className="mt-16 mb-section-gap grid grid-cols-1 md:grid-cols-12 gap-gutter items-end">
        <div className="md:col-span-8 space-y-4">
          <h1 className="font-display-lg text-display-lg text-obsidian">
            {t("account.welcome")} {activeUser.name.split(" ")[0]}.
          </h1>
          <div className="flex items-center gap-4">
            <span className="font-label-caps text-label-caps text-on-surface-variant px-3 py-1 border border-silver-subtle">
              {t("account.memberSince")} {activeUser.memberSince}
            </span>
            <span className="font-label-caps text-label-caps text-bronze-accent border border-bronze-accent px-3 py-1 flex items-center gap-2">
              <Star size={14} /> {t("account.tier")}
            </span>
          </div>
        </div>
        <div className="md:col-span-4 flex justify-start md:justify-end">
          <button className="bg-paper border border-obsidian text-obsidian font-label-caps text-label-caps px-8 py-4 hover:bg-obsidian hover:text-paper transition-colors duration-300">
            {t("account.edit")}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-section-gap">
        {/* Left: orders + tracking */}
        <div className="lg:col-span-8 flex flex-col gap-gutter">
          {/* Orders */}
          <section className="bg-surface-container-lowest p-8 border border-silver-subtle">
            <div className="flex justify-between items-center mb-8 border-b border-silver-subtle pb-4">
              <h2 className="font-headline-sm text-headline-sm text-obsidian">
                {t("account.orders")}
              </h2>
              <Link
                href="/collections"
                className="font-label-caps text-label-caps text-on-surface-variant hover:text-obsidian flex items-center gap-1"
              >
                {t("account.orders.viewAll")}{" "}
                <ChevronRight fontSize="small" />
              </Link>
            </div>
            {userOrders.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t("account.empty")}
              </p>
            ) : (
              <div className="space-y-6">
                {userOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-col md:flex-row gap-6 items-start md:items-center p-4 hover:bg-surface-container-low transition-colors duration-200"
                  >
                    <div className="w-24 h-32 shrink-0 bg-surface-dim overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={o.items[0]?.imageUrl}
                        alt={o.items[0]?.productName[language]}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-label-caps text-label-caps text-on-surface-variant">
                            {t("account.order")} #{o.id}
                          </p>
                          <h3 className="font-headline-sm text-headline-sm text-obsidian mt-1">
                            {o.items[0]?.productName[language]}
                          </h3>
                          {o.trackingNumber && (
                            <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">
                              {o.trackingNumber}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={o.status} locale={language} />
                      </div>
                      <p className="font-price-display text-price-display text-obsidian">
                        {formatCurrencyValue(o.totalAmount, o.currency, language)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tracking */}
          {activeShipment && (
            <section className="bg-surface-container-lowest p-8 border border-silver-subtle relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 100% 100%, #BFA37E 0%, transparent 50%)",
                }}
              />
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <h2 className="font-headline-sm text-headline-sm text-obsidian">
                    {t("account.track")}
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {t("account.track.body")}
                  </p>
                  {activeShipment.trackingNumber && (
                    <p className="font-label-caps text-label-caps text-bronze-accent">
                      {activeShipment.trackingNumber}
                    </p>
                  )}
                </div>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-obsidian text-paper font-label-caps text-label-caps px-8 py-4 hover:bg-graphite transition-colors whitespace-nowrap flex items-center gap-2"
                >
                  {t("account.track.btn")} <Truck fontSize="small" />
                </a>
              </div>
            </section>
          )}
        </div>

        {/* Right: wishlist + settings */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          <section className="bg-surface-container-lowest p-8 border border-silver-subtle flex-grow">
            <div className="flex justify-between items-center mb-8 border-b border-silver-subtle pb-4">
              <h2 className="font-headline-sm text-headline-sm text-obsidian">
                {t("wishlist.title")}
              </h2>
            </div>
            {wishlist.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t("wishlist.empty")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {wishlist.map((w) => {
                  const p = products.find((pr) => pr.id === w.productId);
                  if (!p) return null;
                  return (
                    <div key={w.productId} className="group cursor-pointer">
                      <div className="aspect-[3/4] bg-surface-dim overflow-hidden mb-3 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.images[0]?.url}
                          alt={p.name[language]}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <button
                          onClick={() => toggleWishlist(p.id)}
                          aria-label={t("wishlist.remove")}
                          className="absolute top-2 right-2 text-obsidian hover:text-error transition-colors"
                        >
                          <Heart size={18} fill="#BFA37E" />
                        </button>
                        <button
                          onClick={() => moveWishlistToCart(p.id)}
                          className="absolute bottom-0 left-0 w-full bg-obsidian text-paper font-label-caps text-label-caps text-[10px] py-2 translate-y-full group-hover:translate-y-0 transition-transform"
                        >
                          {t("wishlist.moveToBag")}
                        </button>
                      </div>
                      <h4 className="font-body-md text-body-md text-obsidian truncate">
                        {p.name[language]}
                      </h4>
                      <p className="font-price-display text-price-display text-on-surface-variant text-sm">
                        {formatCurrencyValue(
                          p.basePriceIdr *
                            (currency === "IDR" ? 1 : EXCHANGE_RATES[currency]),
                          currency,
                          language
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="bg-surface-container-lowest p-8 border border-silver-subtle">
            <h2 className="font-headline-sm text-headline-sm text-obsidian mb-6 border-b border-silver-subtle pb-4">
              {t("account.settings")}
            </h2>
            <ul className="space-y-4">
              {[
                language === "id" ? "Informasi Pribadi" : "Personal Information",
                language === "id" ? "Metode Pembayaran" : "Payment Methods",
                language === "id" ? "Buku Alamat" : "Address Book",
              ].map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    className="flex justify-between items-center group"
                  >
                    <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-obsidian transition-colors">
                      {label}
                    </span>
                    <ChevronRight
                      fontSize="small"
                      className="text-silver-subtle group-hover:text-obsidian transition-colors"
                    />
                  </a>
                </li>
              ))}
              <li className="pt-4 mt-4 border-t border-silver-subtle">
                <button
                  onClick={signOut}
                  className="font-label-caps text-label-caps text-on-surface-variant hover:text-error transition-colors w-full text-left flex items-center gap-2"
                >
                  <LogOut fontSize="small" /> {t("account.signout")}
                </button>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  locale,
}: {
  status: any;
  locale: "id" | "en";
}) {
  const shipped = status === "Dikirim";
  return (
    <span
      className={`font-label-caps text-label-caps px-3 py-1 flex items-center gap-1 ${
        shipped
          ? "bg-obsidian text-paper"
          : "bg-surface-container-high text-obsidian"
      }`}
    >
      {shipped && <Truck fontSize="small" />}
      {statusLabel(status, locale)}
    </span>
  );
}
