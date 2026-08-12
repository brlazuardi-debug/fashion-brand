"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Lock, Shield, BadgeCheck, QrCode } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useT } from "@/lib/useT";
import { formatPrice, formatCurrencyValue, EXCHANGE_RATES } from "@/lib/currency";
import {
  COUNTRY_PROFILES,
  SHIPPING_METHODS,
  estimateShippingIdr,
} from "@/lib/shipping";
import type { PaymentMethod } from "@/lib/types";

// ============================================================
// Secure Checkout — 3 steps: Shipping → Method → Payment
// Auto duties/shipping per country; 3DS + QRIS simulations.
// ============================================================
export default function CheckoutPage() {
  const { t, language } = useT();
  const router = useRouter();
  const {
    cart,
    products,
    currency,
    cartSubtotalIdr,
    createOrder,
    showToast,
    activeUser,
  } = useStore();

  const [email, setEmail] = useState(activeUser?.email ?? "");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [country, setCountry] = useState("US");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [payment, setPayment] = useState<PaymentMethod>("card");

  // 3DS / QRIS modals
  const [show3ds, setShow3ds] = useState(false);
  const [otp, setOtp] = useState("");
  const [showQris, setShowQris] = useState(false);
  const [done, setDone] = useState(false);

  const profile = COUNTRY_PROFILES.find((c) => c.code === country);

  const { shippingIdr, dutiesIdr } = useMemo(
    () => estimateShippingIdr(country, cartSubtotalIdr, method),
    [country, cartSubtotalIdr, method]
  );

  const subtotalCur = formatPrice(cartSubtotalIdr, currency, language);
  const shippingCur = formatCurrencyValue(
    shippingIdr * (currency === "IDR" ? 1 : EXCHANGE_RATES[currency]),
    currency,
    language
  );
  const dutiesCur = formatCurrencyValue(
    dutiesIdr * (currency === "IDR" ? 1 : EXCHANGE_RATES[currency]),
    currency,
    language
  );
  const totalIdr = cartSubtotalIdr + shippingIdr + dutiesIdr;
  const totalCur = formatPrice(totalIdr, currency, language);

  const stepReady = {
    shipping: email.trim() !== "" && country !== "",
    method: true,
    payment: true,
  };

  if (cart.length === 0 && !done) {
    return (
      <div className="pt-[88px] min-h-[60vh] flex flex-col items-center justify-center gap-6 px-margin-mobile text-center">
        <p className="font-headline-sm text-headline-sm text-obsidian">
          {t("cart.empty")}
        </p>
        <Link
          href="/collections"
          className="bg-obsidian text-paper font-label-caps text-label-caps px-10 py-4 hover:bg-graphite"
        >
          {t("cart.continue")}
        </Link>
      </div>
    );
  }

  const placeOrder = () => {
    if (payment === "card") {
      setShow3ds(true);
    } else {
      setShowQris(true);
    }
  };

  const finishOrder = async (fraud: "pass" | "review" | "fail") => {
    const order = await createOrder({
      shippingAddress: {
        email,
        firstName: fname,
        lastName: lname,
        country,
        address,
        city,
        postal,
      },
      shippingMethod: method,
      paymentMethod: payment,
      currency,
      subtotal: Number(
        (
          cartSubtotalIdr * (currency === "IDR" ? 1 : EXCHANGE_RATES[currency])
        ).toFixed(2)
      ),
      shippingCost: Number(
        (
          shippingIdr * (currency === "IDR" ? 1 : EXCHANGE_RATES[currency])
        ).toFixed(2)
      ),
      dutiesEstimate: Number(
        (
          dutiesIdr * (currency === "IDR" ? 1 : EXCHANGE_RATES[currency])
        ).toFixed(2)
      ),
      is3ds: payment === "card",
    });
    setShow3ds(false);
    setShowQris(false);
    setDone(true);
    showToast(t("checkout.success.title"));
    setTimeout(() => router.push(`/account?order=${order.id}`), 1800);
  };

  if (done) {
    return (
      <div className="pt-[120px] min-h-[70vh] max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
        <div className="flex flex-col items-center gap-6 py-24">
          <div className="w-16 h-16 bg-obsidian text-paper flex items-center justify-center">
            <Shield size={30} />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-obsidian">
            {t("checkout.success.title")}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            {t("checkout.success.body")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper text-obsidian font-body-md">
      {/* Minimal checkout header */}
      <header className="w-full border-b border-silver-subtle bg-paper/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-container-max mx-auto px-gutter py-6 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-on-surface-variant hover:text-bronze-accent transition-colors w-1/3"
          >
            <ChevronLeft fontSize="small" />
            <span className="font-label-caps text-label-caps uppercase">
              {t("checkout.back")}
            </span>
          </Link>
          <div className="w-1/3 text-center">
            <h1 className="font-headline-md text-headline-md tracking-widest text-obsidian uppercase">
              {t("checkout.title")}
            </h1>
          </div>
          <div className="w-1/3 flex justify-end">
            <Lock fontSize="small" className="text-obsidian" />
          </div>
        </div>
      </header>

      <main className="max-w-container-max mx-auto px-gutter py-margin-desktop md:py-section-gap">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 relative">
          {/* Left column: steps */}
          <div className="lg:col-span-7 flex flex-col gap-16">
            {/* Step 1 */}
            <section className="space-y-8">
              <header className="flex justify-between items-end border-b border-obsidian pb-4">
                <h2 className="font-headline-sm text-headline-sm">
                  {t("checkout.step1")}
                </h2>
              </header>
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
                onSubmit={(e) => e.preventDefault()}
              >
                <Field
                  label={t("checkout.email")}
                  value={email}
                  onChange={setEmail}
                  type="email"
                />
                <div className="hidden md:block" />
                <Field
                  label={t("checkout.fname")}
                  value={fname}
                  onChange={setFname}
                />
                <Field
                  label={t("checkout.lname")}
                  value={lname}
                  onChange={setLname}
                />
                <div className="relative md:col-span-2">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="peer w-full border-0 border-b border-graphite bg-transparent px-0 py-2 text-body-md text-obsidian focus:ring-0 focus:border-obsidian appearance-none cursor-pointer"
                  >
                    {COUNTRY_PROFILES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name[language]}
                      </option>
                    ))}
                  </select>
                  <label className="absolute left-0 -top-3 font-label-caps text-label-caps text-obsidian uppercase">
                    {t("checkout.country")}
                  </label>
                </div>
                <Field
                  label={t("checkout.address")}
                  value={address}
                  onChange={setAddress}
                  colSpan2
                />
                <Field label={t("checkout.city")} value={city} onChange={setCity} />
                <Field
                  label={t("checkout.postal")}
                  value={postal}
                  onChange={setPostal}
                />
              </form>
            </section>

            {/* Step 2 */}
            <section className="space-y-8">
              <header className="flex justify-between items-end border-b border-silver-subtle pb-4">
                <h2
                  className={`font-headline-sm text-headline-sm ${
                    stepReady.shipping ? "text-obsidian" : "text-on-surface-variant"
                  }`}
                >
                  {t("checkout.step2")}
                </h2>
              </header>
              <div className="space-y-4">
                {(["standard", "express"] as const).map((m) => {
                  const mp = SHIPPING_METHODS[m];
                  const costIdr =
                    estimateShippingIdr(country, cartSubtotalIdr, m).shippingIdr;
                  const costCur = formatPrice(costIdr, currency, language);
                  const dutyNote =
                    m === "express"
                      ? language === "id"
                        ? "Termasuk est. Bea & Pajak"
                        : "Includes est. Duties & Taxes"
                      : language === "id"
                      ? "Bea belum dibayar (DDU)"
                      : "Duties unpaid (DDU)";
                  return (
                    <label
                      key={m}
                      className={`flex items-start p-4 border cursor-pointer group hover:bg-surface-container-low transition-colors ${
                        method === m ? "border-obsidian" : "border-silver-subtle"
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping_method"
                        checked={method === m}
                        onChange={() => setMethod(m)}
                        className="mt-1 h-4 w-4 rounded-none border-obsidian text-obsidian accent-obsidian"
                      />
                      <div className="ml-4 flex flex-1 flex-col">
                        <span className="font-label-caps text-label-caps text-obsidian uppercase">
                          {mp.name[language]}
                        </span>
                        <span className="font-body-md text-body-md text-on-surface-variant mt-1">
                          {mp.days[language]}
                        </span>
                      </div>
                      <div className="ml-4 flex flex-col items-end">
                        <span className="font-price-display text-price-display text-obsidian">
                          {costCur}
                        </span>
                        <span className="font-label-caps text-[10px] text-bronze-accent uppercase mt-1">
                          {dutyNote}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Step 3 */}
            <section className="space-y-8">
              <header className="flex justify-between items-end border-b border-silver-subtle pb-4">
                <h2 className="font-headline-sm text-headline-sm text-obsidian">
                  {t("checkout.step3")}
                </h2>
              </header>
              <div className="border border-graphite divide-y divide-silver-subtle">
                {/* Card */}
                <div className="p-4 bg-surface-container-lowest">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === "card"}
                      onChange={() => setPayment("card")}
                      className="h-4 w-4 rounded-none border-obsidian text-obsidian accent-obsidian"
                    />
                    <span className="ml-4 font-label-caps text-label-caps text-obsidian uppercase flex-1">
                      {t("checkout.pay.card")}
                    </span>
                    <Shield size={18} className="text-outline" />
                  </label>
                  {payment === "card" && (
                    <div className="mt-6 space-y-4 pl-8">
                      <Field label={t("checkout.card.number")} placeholder="4242 4242 4242 4242" />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label={t("checkout.card.exp")} placeholder="MM / YY" />
                        <Field label={t("checkout.card.cvc")} placeholder="123" />
                      </div>
                    </div>
                  )}
                </div>
                {/* QRIS */}
                <div className="p-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === "qris"}
                      onChange={() => setPayment("qris")}
                      className="h-4 w-4 rounded-none border-obsidian text-obsidian accent-obsidian"
                    />
                    <span className="ml-4 font-label-caps text-label-caps text-obsidian uppercase flex-1">
                      {t("checkout.pay.qris")}
                    </span>
                    <QrCode size={18} className="text-outline" />
                  </label>
                </div>
              </div>
              <div>
                <button
                  onClick={placeOrder}
                  className="w-full bg-obsidian text-paper font-label-caps text-label-caps py-5 px-10 uppercase hover:bg-graphite transition-colors duration-300 flex justify-center items-center gap-2"
                >
                  <span>{t("checkout.place")}</span>
                  <Lock fontSize="small" />
                </button>
              </div>
            </section>
          </div>

          {/* Right column: summary */}
          <aside className="lg:col-span-5 relative">
            <div className="sticky top-32 bg-surface-container-low p-8 lg:p-10 border border-silver-subtle">
              <h2 className="font-headline-sm text-headline-sm text-obsidian border-b border-obsidian pb-4 mb-8">
                {t("checkout.summary")}
              </h2>
              <div className="space-y-6 mb-8 border-b border-silver-subtle pb-8">
                {cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;
                  return (
                    <div key={item.id} className="flex gap-6">
                      <div className="w-24 h-32 flex-shrink-0 bg-surface-variant relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.images[0]?.url}
                          alt={product.name[language]}
                          className="w-full h-full object-cover grayscale-[20%]"
                        />
                      </div>
                      <div className="flex flex-col flex-1 justify-between py-1">
                        <div>
                          <h3 className="font-body-lg text-body-lg text-obsidian uppercase tracking-wide">
                            {product.name[language]}
                          </h3>
                          <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">
                            {t("product.size")}: {item.size}
                          </p>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="font-body-md text-on-surface-variant">
                            Qty: {item.qty}
                          </span>
                          <span className="font-price-display text-price-display text-obsidian">
                            {formatPrice(
                              product.basePriceIdr * item.qty,
                              currency,
                              language
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3 font-body-md text-body-md text-obsidian">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">
                    {t("checkout.subtotal")}
                  </span>
                  <span>{subtotalCur}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">
                    {t("checkout.shipping")}
                  </span>
                  <span>{shippingCur}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">
                    {t("checkout.duties")}
                  </span>
                  <span className="text-bronze-accent">{dutiesCur}</span>
                </div>
              </div>
              <div className="border-t border-obsidian mt-6 pt-6 flex justify-between items-end">
                <span className="font-headline-sm text-headline-sm text-obsidian uppercase">
                  {t("checkout.total")}
                </span>
                <div className="text-right">
                  <span className="font-price-display text-headline-md text-obsidian block leading-none">
                    {totalCur}
                  </span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase mt-1 block">
                    {currency}
                  </span>
                </div>
              </div>
              <div className="mt-8 flex justify-center gap-4 text-outline border-t border-silver-subtle pt-6">
                <Lock fontSize="small" />
                <BadgeCheck fontSize="small" />
                <Shield fontSize="small" />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* 3DS Modal */}
      {show3ds && (
        <Modal onClose={() => setShow3ds(false)}>
          <h3 className="font-headline-sm text-headline-sm text-obsidian mb-2">
            {t("checkout.3ds.title")}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            {t("checkout.3ds.body")}
          </p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            className="field-input mb-2 font-label-caps text-label-caps tracking-[0.3em]"
            maxLength={6}
          />
          <button
            onClick={() => finishOrder("pass")}
            className="w-full bg-obsidian text-paper font-label-caps text-label-caps py-4 mt-4 hover:bg-graphite"
          >
            {t("checkout.3ds.verify")}
          </button>
          <button
            onClick={() => setOtp("")}
            className="w-full font-label-caps text-label-caps text-outline py-3 hover:text-obsidian"
          >
            {t("checkout.3ds.resend")}
          </button>
        </Modal>
      )}

      {/* QRIS Modal */}
      {showQris && (
        <Modal onClose={() => setShowQris(false)}>
          <h3 className="font-headline-sm text-headline-sm text-obsidian mb-2">
            {t("checkout.qris.title")}
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mb-6">
            {t("checkout.qris.body")}
          </p>
          <div className="flex items-center justify-center bg-white p-4 mb-6">
            <QRCodeSVG value={`dasilvabatik://qris/${totalIdr}`} />
          </div>
          <button
            onClick={() => finishOrder("pass")}
            className="w-full bg-obsidian text-paper font-label-caps text-label-caps py-4 hover:bg-graphite"
          >
            {t("checkout.qris.confirm")}
          </button>
        </Modal>
      )}
    </div>
  );
}

// Floating-label field
function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  colSpan2,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  colSpan2?: boolean;
}) {
  return (
    <div className={`relative pt-4 ${colSpan2 ? "md:col-span-2" : ""}`}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
      <label className="absolute left-0 top-0 font-label-caps text-label-caps text-obsidian uppercase">
        {label}
      </label>
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-obsidian/50 px-margin-mobile"
      onClick={onClose}
    >
      <div
        className="bg-paper border border-silver-subtle p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// Lightweight inline QR placeholder (deterministic grid from string hash).
function QRCodeSVG({ value }: { value: string }) {
  const size = 21;
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const cells = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const on = ((h >> ((x * 3 + y * 7) % 31)) ^ (x * y)) & 1;
      if (on) {
        cells.push(
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width={1}
            height={1}
            fill="#0D0D0D"
          />
        );
      }
    }
  }
  return (
    <svg width={180} height={180} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#fff" />
      {cells}
    </svg>
  );
}
