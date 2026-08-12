"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Plus, Minus } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useT } from "@/lib/useT";
import { formatPrice } from "@/lib/currency";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

// ============================================================
// Product Detail — client interactive layer.
// Server component (page.tsx) loads the product from SQLite and
// passes it here for cart / wishlist / gallery / accordion behavior.
// ============================================================
export default function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { t, language } = useT();
  const {
    addToCart,
    currency,
    toggleWishlist,
    isWishlisted,
    showToast,
  } = useStore();

  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState<string>("");
  const [zoom, setZoom] = useState(false);
  const [open, setOpen] = useState<string>("description");

  const wish = isWishlisted(product.id);
  const soldOut = product.isSoldOut || product.isActive === false;
  const images = product.images.length ? product.images : [];

  const selectSize = (s: string, stock: number) => {
    if (stock <= 0) return;
    setSize(s);
  };

  const handleAdd = () => {
    if (soldOut) return;
    const chosen =
      size ||
      product.variants.find((v) => v.stockQty > 0)?.size;
    if (!chosen) {
      showToast(t("product.outOfStock"));
      return;
    }
    addToCart(product.id, chosen, 1);
    showToast(t("product.added"));
  };

  const toggleAcc = (key: string) =>
    setOpen((cur) => (cur === key ? "" : key));

  return (
    <div className="pt-[88px] pb-32 md:pb-0">
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 md:pt-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          {/* Gallery */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <div
              className="relative w-full aspect-[3/4] bg-surface-container overflow-hidden group cursor-zoom-in"
              onClick={() => setZoom((v) => !v)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeImg]?.url}
                alt={images[activeImg]?.alt[language] ?? product.name[language]}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  zoom ? "scale-150" : "group-hover:scale-105"
                }`}
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-2 gap-4">
                {images.slice(0, 4).map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={`w-full aspect-[3/4] bg-surface-container overflow-hidden border ${
                      activeImg === i ? "border-obsidian" : "border-transparent"
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt[language]}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:col-span-5 flex flex-col pt-4 md:pt-12 md:sticky md:top-24 h-fit">
            <nav className="flex items-center gap-2 text-outline font-label-caps text-label-caps mb-6 uppercase">
              <Link href="/collections" className="hover:text-obsidian">
                {t("nav.explore")}
              </Link>
              <span>/</span>
              <span className="text-obsidian">{product.category}</span>
            </nav>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-obsidian mb-2">
              {product.name[language]}
            </h1>
            <p className="font-price-display text-price-display text-obsidian mb-8">
              {formatPrice(product.basePriceIdr, currency)}
            </p>

            {/* Size selector */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <span className="font-label-caps text-label-caps text-obsidian uppercase">
                  {t("product.size")}
                </span>
                <button className="font-label-caps text-label-caps text-outline hover:text-obsidian underline transition-colors uppercase">
                  {t("product.sizeGuide")}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {product.variants.map((v) => {
                  const disabled = v.stockQty <= 0;
                  const selected = size === v.size;
                  return (
                    <button
                      key={v.id}
                      disabled={disabled}
                      onClick={() => selectSize(v.size, v.stockQty)}
                      className={`py-3 border font-label-caps text-label-caps uppercase transition-colors ${
                        selected
                          ? "border-obsidian bg-obsidian text-paper"
                          : "border-silver-subtle text-obsidian hover:border-obsidian"
                      } ${disabled ? "text-opacity-30 cursor-not-allowed" : ""}`}
                    >
                      {v.size}
                    </button>
                  );
                })}
              </div>
              {size && (
                <p className="font-label-caps text-label-caps text-bronze-accent mt-3">
                  {product.variants.find((v) => v.size === size)?.stockQty}{" "}
                  {language === "id" ? "tersisa" : "in stock"}
                </p>
              )}
            </div>

            {/* Add to bag (desktop) */}
            <div className="flex gap-4 mb-12 hidden md:flex">
              <button
                onClick={handleAdd}
                disabled={soldOut}
                className="flex-1 bg-obsidian text-paper font-label-caps text-label-caps py-4 px-10 hover:bg-graphite transition-colors uppercase tracking-widest disabled:opacity-40"
              >
                {soldOut ? t("product.outOfStock") : t("product.addToBag")}
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label={t("wishlist.add")}
                className="w-14 h-14 flex items-center justify-center border border-obsidian text-obsidian hover:bg-surface-container transition-colors"
              >
                <Heart size={20} fill={wish ? "#BFA37E" : "none"} />
              </button>
            </div>

            {/* Accordion */}
            <div className="border-t border-silver-subtle">
              <AccordionItem
                title={t("product.description")}
                open={open === "description"}
                onToggle={() => toggleAcc("description")}
              >
                <p className="mb-4">{product.description[language]}</p>
                {language === "en" && (
                  <p className="text-sm italic text-outline">
                    {product.description.id}
                  </p>
                )}
              </AccordionItem>
              <AccordionItem
                title={t("product.care")}
                open={open === "care"}
                onToggle={() => toggleAcc("care")}
              >
                <p>{product.care[language]}</p>
              </AccordionItem>
              <AccordionItem
                title={t("product.shipping")}
                open={open === "shipping"}
                onToggle={() => toggleAcc("shipping")}
              >
                <p>{product.shipping[language]}</p>
              </AccordionItem>
            </div>
          </div>
        </div>

        {/* Related */}
        <section className="mt-section-gap mb-section-gap">
          <h2 className="font-headline-md text-headline-md text-obsidian text-center mb-12">
            {t("product.related")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>

      {/* Mobile sticky add to bag */}
      <div className="md:hidden fixed bottom-16 left-0 w-full bg-paper border-t border-silver-subtle p-4 z-40 flex gap-2">
        <button
          onClick={handleAdd}
          disabled={soldOut}
          className="flex-1 bg-obsidian text-paper font-label-caps text-label-caps py-4 hover:bg-graphite transition-colors uppercase tracking-widest disabled:opacity-40"
        >
          {soldOut ? t("product.outOfStock") : t("product.addToBag")}
        </button>
        <button
          onClick={() => toggleWishlist(product.id)}
          aria-label={t("wishlist.add")}
          className="w-14 h-14 flex items-center justify-center border border-obsidian text-obsidian bg-paper"
        >
          <Heart size={20} fill={wish ? "#BFA37E" : "none"} />
        </button>
      </div>
    </div>
  );
}

function AccordionItem({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-silver-subtle">
      <button
        onClick={onToggle}
        className="py-5 w-full flex justify-between items-center group"
      >
        <span className="font-label-caps text-label-caps text-obsidian uppercase tracking-widest group-hover:text-bronze-accent transition-colors">
          {title}
        </span>
        <span className="text-obsidian">{open ? <Minus size={18} /> : <Plus size={18} />}</span>
      </button>
      {open && (
        <div className="pb-5 text-on-surface-variant font-body-md text-body-md leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
