"use client";

import { useStore } from "@/context/StoreContext";
import { translate, type TKey } from "@/lib/i18n";

// Translation hook bound to the active store locale.
export function useT() {
  const { language } = useStore();
  const t = (key: TKey): string => translate(language, key);
  return { t, language };
}
