import type { Currency, Locale } from "./types";

// ============================================================
// Multi-currency (PRD 6.8 / INTL-2): IDR base, USD & EUR derived.
// rate = amount of TARGET currency per 1 IDR.
// Source: indicative rates (1 USD ≈ IDR 16,450 ; 1 EUR ≈ IDR 17,800).
// ============================================================

export const EXCHANGE_RATES: Record<Currency, number> = {
  IDR: 1,
  USD: 1 / 16450,
  EUR: 1 / 17800,
};

export const RATE_UPDATED_AT = "2026-08-11";

export function convertFromIdr(amountIdr: number, currency: Currency): number {
  return amountIdr * EXCHANGE_RATES[currency];
}

// Format an IDR-denominated amount into the target currency's display string.
export function formatPrice(
  amountIdr: number,
  currency: Currency,
  locale: Locale = "en"
): string {
  const value = convertFromIdr(amountIdr, currency);
  return formatCurrencyValue(value, currency, locale);
}

// Format an already-converted scalar value in the given currency.
export function formatCurrencyValue(
  value: number,
  currency: Currency,
  locale: Locale = "en"
): string {
  const intlLocale = locale === "id" ? "id-ID" : "en-US";
  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function currencySymbol(currency: Currency): string {
  if (currency === "IDR") return "Rp";
  if (currency === "EUR") return "€";
  return "$";
}

// Validate a converted amount is finite & non-negative (self-check guard)
export function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}
