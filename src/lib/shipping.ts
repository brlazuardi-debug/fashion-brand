import type { CountryShippingProfile, LocalizedString } from "./types";
import { EXCHANGE_RATES } from "./currency";

// ============================================================
// International shipping & import duties calculator (PRD ORD-3 / PAY-2)
// Duties are a percentage of goods value; shipping has a per-country base.
// ============================================================

export const COUNTRY_PROFILES: CountryShippingProfile[] = [
  { code: "ID", name: { id: "Indonesia", en: "Indonesia" }, dutyRate: 0, baseShippingUsd: 0, region: "Asia" },
  { code: "US", name: { id: "Amerika Serikat", en: "United States" }, dutyRate: 0.075, baseShippingUsd: 45, region: "Americas" },
  { code: "GB", name: { id: "Inggris", en: "United Kingdom" }, dutyRate: 0.06, baseShippingUsd: 52, region: "Europe" },
  { code: "SG", name: { id: "Singapura", en: "Singapore" }, dutyRate: 0.0, baseShippingUsd: 28, region: "Asia" },
  { code: "AU", name: { id: "Australia", en: "Australia" }, dutyRate: 0.05, baseShippingUsd: 48, region: "Oceania" },
  { code: "NL", name: { id: "Belanda", en: "Netherlands" }, dutyRate: 0.06, baseShippingUsd: 50, region: "Europe" },
  { code: "JP", name: { id: "Jepang", en: "Japan" }, dutyRate: 0.04, baseShippingUsd: 44, region: "Asia" },
  { code: "AE", name: { id: "Uni Emirat Arab", en: "United Arab Emirates" }, dutyRate: 0.05, baseShippingUsd: 55, region: "Middle East" },
];

export const SHIPPING_METHODS = {
  standard: { id: "standard", name: { id: "Standar Internasional", en: "Standard International" }, days: { id: "7–14 Hari Kerja", en: "7–14 Business Days" }, multiplier: 1 },
  express: { id: "express", name: { id: "DHL Express Prioritas", en: "DHL Express Priority" }, days: { id: "3–5 Hari Kerja", en: "3–5 Business Days" }, multiplier: 2.6 },
} as const;

export function getCountryProfile(code: string): CountryShippingProfile | undefined {
  return COUNTRY_PROFILES.find((c) => c.code === code);
}

// Returns shipping cost & duties ESTIMATE in IDR (base currency).
export function estimateShippingIdr(
  countryCode: string,
  goodsValueIdr: number,
  method: "standard" | "express" = "standard"
): { shippingIdr: number; dutiesIdr: number } {
  const profile = getCountryProfile(countryCode);
  // Domestic (Indonesia): no international shipping cost, no import duty.
  if (!profile || profile.code === "ID") {
    return { shippingIdr: 0, dutiesIdr: 0 };
  }
  const baseUsd = profile.baseShippingUsd * SHIPPING_METHODS[method].multiplier;
  const usdRate = EXCHANGE_RATES.USD; // USD per 1 IDR
  const shippingIdr = baseUsd / usdRate; // USD -> IDR
  const dutiesIdr = Math.round(goodsValueIdr * profile.dutyRate);
  return { shippingIdr: Math.round(shippingIdr), dutiesIdr };
}

export function totalEstimateIdr(
  goodsValueIdr: number,
  countryCode: string,
  method: "standard" | "express" = "standard"
): { shippingIdr: number; dutiesIdr: number; totalIdr: number } {
  const { shippingIdr, dutiesIdr } = estimateShippingIdr(countryCode, goodsValueIdr, method);
  return {
    shippingIdr,
    dutiesIdr,
    totalIdr: goodsValueIdr + shippingIdr + dutiesIdr,
  };
}
