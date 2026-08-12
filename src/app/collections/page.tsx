"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useT } from "@/lib/useT";
import ProductCard from "@/components/ProductCard";
import type { Category } from "@/lib/types";

type SortKey = "featured" | "priceAsc" | "priceDesc" | "name";

const CATEGORIES: (Category | "All")[] = [
  "All",
  "Outerwear",
  "Shirts",
  "Dresses",
  "Accessories",
];

export default function CollectionsPage() {
  const { t, language } = useT();
  const { products } = useStore();
  const [category, setCategory] = useState<Category | "All">("All");
  const [sort, setSort] = useState<SortKey>("featured");

  const filtered = useMemo(() => {
    let list = products.filter(
      (p) => p.isActive !== false && p.isSoldOut !== true
    );
    if (category !== "All") {
      list = list.filter((p) => p.category === category);
    }
    const sorted = [...list];
    if (sort === "priceAsc") sorted.sort((a, b) => a.basePriceIdr - b.basePriceIdr);
    if (sort === "priceDesc") sorted.sort((a, b) => b.basePriceIdr - a.basePriceIdr);
    if (sort === "name")
      sorted.sort((a, b) =>
        a.name[language].localeCompare(b.name[language])
      );
    // featured: limited first, then keep original order
    if (sort === "featured") {
      sorted.sort((a, b) => Number(b.isLimited) - Number(a.isLimited));
    }
    return sorted;
  }, [products, category, sort, language]);

  return (
    <div className="flex-grow pt-[88px] pb-section-gap px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto">
      <div className="mb-16">
        <h2 className="font-display-lg text-display-lg mb-8 text-center mt-12">
          {t("collections.title")}
        </h2>
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-silver-subtle pb-6 gap-6">
          {/* Category filter */}
          <div className="flex gap-8 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            {CATEGORIES.map((c) => {
              const active = category === c;
              const label = c === "All" ? t("common.all") : c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`font-label-caps text-label-caps whitespace-nowrap pb-1 transition-colors ${
                    active
                      ? "text-obsidian border-b-2 border-obsidian"
                      : "text-outline hover:text-obsidian"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {/* Sort dropdown */}
          <div className="relative group cursor-pointer w-full md:w-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="appearance-none bg-transparent font-label-caps text-label-caps text-obsidian border border-silver-subtle px-4 py-2 pr-10 focus:border-obsidian outline-none cursor-pointer w-full md:w-auto"
              aria-label={t("collections.sort")}
            >
              <option value="featured">{t("collections.sort.featured")}</option>
              <option value="priceAsc">{t("collections.sort.priceAsc")}</option>
              <option value="priceDesc">{t("collections.sort.priceDesc")}</option>
              <option value="name">{t("collections.sort.name")}</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-obsidian">
              <ChevronDown size={16} />
            </span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-body-md text-body-md text-on-surface-variant text-center py-24">
          {t("collections.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-16 lg:gap-x-12 lg:gap-y-24">
          {filtered.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              showQuickAdd
            />
          ))}
        </div>
      )}
    </div>
  );
}
