"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ShoppingBag, Search, User, Heart } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useT } from "@/lib/useT";
import type { Currency, Locale } from "@/lib/types";

// Global navigation bar — matches the editorial TopAppBar mockup.
// Desktop: centered wordmark, language + currency toggles, cart.
// Mobile: compact bar with menu / wordmark / cart, plus bottom nav.
export default function Header() {
  const { t, language } = useT();
  const {
    currency,
    setCurrency,
    setLanguage,
    cartCount,
    openCart,
    activeUser,
  } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const currencies: Currency[] = ["IDR", "USD", "EUR"];
  const locales: Locale[] = ["id", "en"];

  const cycleCurrency = () => {
    const idx = currencies.indexOf(currency);
    setCurrency(currencies[(idx + 1) % currencies.length]);
  };
  const cycleLanguage = () => {
    const idx = locales.indexOf(language);
    setLanguage(locales[(idx + 1) % locales.length]);
  };

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/collections", label: t("nav.explore") },
    { href: "/account", label: t("nav.profile") },
    { href: "/admin", label: t("nav.admin") },
  ];

  return (
    <>
      {/* Desktop header */}
      <header className="bg-paper/90 backdrop-blur-md border-b border-silver-subtle fixed top-0 w-full z-50 hidden md:block">
        <div className="flex justify-between items-center px-gutter py-4 w-full max-w-container-max mx-auto">
          <div className="flex items-center space-x-6 text-on-surface-variant hover:text-bronze-accent transition-colors duration-300">
            <button
              aria-label={t("nav.menu")}
              className="flex items-center gap-1 font-label-caps text-label-caps"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Menu size={20} />
            </button>
          </div>
          <Link
            href="/"
            className="font-headline-md text-headline-md tracking-widest text-obsidian absolute left-1/2 transform -translate-x-1/2"
          >
            DASILVA BATIK
          </Link>
          <div className="flex items-center space-x-6 text-on-surface-variant hover:text-bronze-accent transition-colors duration-300">
            <button
              onClick={() => {
                setLanguage(language === "id" ? "en" : "id");
              }}
              className="font-label-caps text-label-caps flex items-center gap-2 hover:text-bronze-accent"
              aria-label="Toggle language"
            >
              <span className={language === "id" ? "text-obsidian" : ""}>
                ID
              </span>
              <span className="h-3 w-px bg-silver-subtle" />
              <span className={language === "en" ? "text-obsidian" : ""}>
                EN
              </span>
            </button>
            <button
              onClick={cycleCurrency}
              className="font-label-caps text-label-caps text-obsidian"
              aria-label="Cycle currency"
            >
              {currency === "IDR"
                ? "IDR"
                : currency === "USD"
                ? "USD"
                : "EUR"}
            </button>
            <button
              aria-label={t("nav.cart")}
              onClick={openCart}
              className="relative hover:text-bronze-accent transition-colors"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-bronze-accent text-paper text-[10px] w-4 h-4 flex items-center justify-center font-label-caps">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-silver-subtle bg-paper">
            <nav className="max-w-container-max mx-auto px-gutter py-4 flex flex-col">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="font-label-caps text-label-caps py-3 border-b border-silver-subtle text-obsidian hover:text-bronze-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile header */}
      <header className="bg-paper/90 backdrop-blur-md border-b border-silver-subtle fixed top-0 w-full z-50 md:hidden flex justify-between items-center px-margin-mobile py-4">
        <button
          aria-label={t("nav.menu")}
          className="text-obsidian"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Menu size={22} />
        </button>
        <Link
          href="/"
          className="font-headline-md text-headline-sm tracking-widest text-obsidian"
        >
          DASILVA BATIK
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={cycleLanguage}
            className="font-label-caps text-label-caps text-obsidian"
            aria-label="Toggle language"
          >
            {language === "id" ? "ID" : "EN"}
          </button>
          <button
            aria-label={t("nav.cart")}
            onClick={openCart}
            className="relative text-obsidian"
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-bronze-accent text-paper text-[10px] w-4 h-4 flex items-center justify-center font-label-caps">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile full menu */}
      {menuOpen && (
        <div className="fixed inset-0 top-[64px] bg-paper z-40 md:hidden">
          <nav className="px-margin-mobile py-8 flex flex-col gap-6">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-headline-sm text-headline-sm text-obsidian hover:text-bronze-accent"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-6 border-t border-silver-subtle flex flex-col gap-4">
              <button
                onClick={cycleCurrency}
                className="font-label-caps text-label-caps text-obsidian text-left"
              >
                {t("collections.filter")}: {currency}
              </button>
              <span className="font-label-caps text-label-caps text-outline">
                {activeUser ? activeUser.name : t("account.signin")}
              </span>
            </div>
          </nav>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-16 px-4 pb-safe bg-paper border-t border-silver-subtle z-40 md:hidden">
        <Link href="/" className="flex flex-col items-center justify-center text-obsidian">
          <HomeIcon />
        </Link>
        <Link
          href="/collections"
          className="flex flex-col items-center justify-center text-outline hover:text-bronze-accent"
        >
          <Search size={22} />
        </Link>
        <Link
          href="/account"
          className="flex flex-col items-center justify-center text-outline hover:text-bronze-accent"
        >
          <Heart size={22} />
        </Link>
        <button
          onClick={openCart}
          className="flex flex-col items-center justify-center text-outline hover:text-bronze-accent"
        >
          <User size={22} />
        </button>
      </nav>
    </>
  );
}

function HomeIcon() {
  // inline home to avoid extra icon import duplication
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
