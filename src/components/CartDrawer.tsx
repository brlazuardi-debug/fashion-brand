"use client";

import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useT } from "@/lib/useT";
import { formatPrice } from "@/lib/currency";

// Slide-out cart drawer from the right (Atelier Heritage: paper bg, 0px radius).
export default function CartDrawer() {
  const { t } = useT();
  const {
    cart,
    products,
    currency,
    cartOpen,
    closeCart,
    removeFromCart,
    updateCartQty,
    cartSubtotalIdr,
    openCart,
  } = useStore();

  return (
    <>
      {/* overlay */}
      <div
        className={`fixed inset-0 bg-obsidian/40 z-50 transition-opacity duration-300 ${
          cartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
        aria-hidden
      />
      {/* drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-paper z-50 border-l border-silver-subtle transition-transform duration-300 ease-out-soft ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label={t("cart.title")}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-silver-subtle">
          <h2 className="font-headline-sm text-headline-sm text-obsidian">
            {t("cart.title")}
          </h2>
          <button
            onClick={closeCart}
            aria-label={t("common.close")}
            className="text-obsidian hover:text-bronze-accent"
          >
            <X size={22} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60%] px-6 text-center">
            <ShoppingBag size={40} className="text-silver-subtle mb-4" />
            <p className="font-body-md text-body-md text-on-surface-variant mb-8">
              {t("cart.empty")}
            </p>
            <button
              onClick={closeCart}
              className="bg-obsidian text-paper font-label-caps text-label-caps px-10 py-4 hover:bg-graphite transition-colors"
            >
              {t("cart.continue")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 h-[calc(100%-180px)]">
              {cart.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product) return null;
                return (
                  <div key={item.id} className="flex gap-4 border-b border-silver-subtle pb-6">
                    <div className="w-20 h-28 bg-surface-container shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images[0]?.url}
                        alt={product.name.en}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-obsidian">
                            {product.name.en}
                          </h3>
                          <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">
                            {t("product.size")}: {item.size}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-outline hover:text-error"
                          aria-label={t("cart.remove")}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <div className="flex items-center border border-graphite">
                          <button
                            onClick={() => updateCartQty(item.id, item.qty - 1)}
                            className="w-8 h-8 flex items-center justify-center text-obsidian hover:bg-surface-container"
                            aria-label="-"
                          >
                            –
                          </button>
                          <span className="w-8 h-8 flex items-center justify-center font-body-md text-body-md text-obsidian">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateCartQty(item.id, item.qty + 1)}
                            className="w-8 h-8 flex items-center justify-center text-obsidian hover:bg-surface-container"
                            aria-label="+"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-price-display text-price-display text-obsidian">
                          {formatPrice(product.basePriceIdr * item.qty, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-silver-subtle px-6 py-5 absolute bottom-0 w-full bg-paper">
              <div className="flex justify-between items-end mb-4">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  {t("cart.subtotal")}
                </span>
                <span className="font-price-display text-price-display text-obsidian text-xl">
                  {formatPrice(cartSubtotalIdr, currency)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full bg-obsidian text-paper font-label-caps text-label-caps py-4 flex items-center justify-center hover:bg-graphite transition-colors"
              >
                {t("cart.checkout")}
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
