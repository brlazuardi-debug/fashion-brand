"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useT } from "@/lib/useT";
import { formatPrice } from "@/lib/currency";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
  priority?: boolean; // show limited badge offset
  showQuickAdd?: boolean;
  index?: number; // for staircase layout on collections (md:mt-24)
}

// Editorial product card — no border/shadow, full-bleed image, left-aligned
// name + price, optional "Limited Edition" badge & quick-add.
export default function ProductCard({
  product,
  index = 0,
  showQuickAdd = false,
}: Props) {
  const { t, language } = useT();
  const { currency, addToCart, toggleWishlist, isWishlisted } = useStore();
  const wish = isWishlisted(product.id);
  const soldOut = product.isSoldOut || product.isActive === false;
  const firstAvailable =
    product.variants.find((v) => v.stockQty > 0)?.size ?? "ONE SIZE";

  const staircase = index % 2 === 1 ? "md:mt-24" : "";

  return (
    <article
      className={`group relative flex flex-col items-start w-full ${
        soldOut ? "opacity-60" : ""
      } ${staircase}`}
    >
      <div className="w-full aspect-[3/4] mb-6 overflow-hidden bg-surface-container relative">
        {product.isLimited && !soldOut && (
          <div className="absolute top-4 left-4 z-10 border border-bronze-accent px-3 py-1 bg-paper/80 backdrop-blur-sm">
            <span className="font-label-caps text-label-caps text-bronze-accent">
              LIMITED EDITION
            </span>
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-paper bg-opacity-20 backdrop-blur-sm">
            <span className="font-label-caps text-label-caps text-obsidian bg-paper px-6 py-2 border border-obsidian">
              {t("product.outOfStock")}
            </span>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]?.url}
          alt={product.name[language]}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {showQuickAdd && !soldOut && (
          <button
            onClick={() => addToCart(product.id, firstAvailable, 1)}
            className="absolute bottom-0 left-0 w-full bg-obsidian text-on-primary font-label-caps text-label-caps py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          >
            {t("collections.quickAdd")}
          </button>
        )}
        <button
          onClick={() => toggleWishlist(product.id)}
          aria-label={t("wishlist.add")}
          className="absolute top-3 right-3 z-10 text-obsidian hover:text-bronze-accent transition-colors"
        >
          <Heart size={20} fill={wish ? "#BFA37E" : "none"} />
        </button>
      </div>
      <Link href={`/product/${product.id}`} className="block w-full">
        <h3 className="font-headline-sm text-headline-sm mb-2 text-obsidian group-hover:text-bronze-accent transition-colors">
          {product.name[language]}
        </h3>
        <p className="font-price-display text-price-display text-obsidian">
          {formatPrice(product.basePriceIdr, currency)}
        </p>
      </Link>
    </article>
  );
}
