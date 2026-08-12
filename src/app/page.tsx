"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useT } from "@/lib/useT";
import ProductCard from "@/components/ProductCard";

// ============================================================
// Homepage — Hero + horizontally-scrolling Curated Editions.
// ============================================================
export default function HomePage() {
  const { t } = useT();
  const { products } = useStore();
  const featured = products.filter((p) => p.isActive !== false).slice(0, 8);
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    scroller.current?.scrollBy({ left: dir * 420, behavior: "smooth" });
  };

  return (
    <div className="pt-[72px] md:pt-[88px]">
      {/* Hero */}
      <section className="relative w-full h-[80vh] md:h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="w-full h-full object-cover object-center"
            alt="High-end editorial fashion photography of a model wearing a luxurious modern interpretation of traditional Indonesian Batik."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhKLnI5K1oo6Cf6RCQAK7jAZeKaO_eg80IUemov2drOCeAJvDl-6YD6hn0nNAEMjhtdlaPMdMpKzXT_bYcm_BuTaSJ4lUYkUz_dKfZfu2E_hZ-KJmZ_tvMdRhF6Q9jZQecB2X8gb876uojtbKorq5GOqpVSZ6MeuYd19qzJaob3Rt8xTL2IrMTqa2E1SKcAzJBR4DETOggPv1heHI03Xh9j4WTKVp8byeCkixnf9fWQIbueRAZey4r"
          />
        </div>
        <div className="absolute inset-0 bg-obsidian bg-opacity-20" />
        <div className="relative z-10 text-center px-margin-mobile md:px-margin-desktop max-w-3xl flex flex-col items-center">
          <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-paper mb-6 font-light">
            {t("home.hero.title")}
          </h1>
          <p className="font-body-lg text-body-lg text-paper mb-10 opacity-90 max-w-lg">
            {t("home.hero.subtitle")}
          </p>
          <Link
            href="/collections"
            className="inline-flex items-center justify-center bg-obsidian text-paper font-label-caps text-label-caps px-10 py-4 hover:bg-graphite transition-colors duration-300"
          >
            {t("home.hero.cta")}
          </Link>
        </div>
      </section>

      {/* Curated Editions carousel */}
      <section className="py-section-gap px-0 md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
        <div className="px-margin-mobile md:px-0 mb-12 flex justify-between items-end">
          <div>
            <h2 className="font-headline-lg text-headline-md md:text-headline-lg text-obsidian mb-2">
              {t("home.curated.title")}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t("home.curated.subtitle")}
            </p>
          </div>
          <div className="hidden md:flex space-x-4">
            <button
              onClick={() => scrollBy(-1)}
              className="w-10 h-10 border border-silver-subtle flex items-center justify-center hover:border-obsidian transition-colors"
              aria-label="Previous"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="w-10 h-10 border border-silver-subtle flex items-center justify-center hover:border-obsidian transition-colors"
              aria-label="Next"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <div
          ref={scroller}
          className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory px-margin-mobile md:px-0 space-x-6 pb-8"
        >
          {featured.map((product) => (
            <div
              key={product.id}
              className="min-w-[280px] md:min-w-[400px] flex-shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
