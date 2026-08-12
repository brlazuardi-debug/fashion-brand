"use client";

import { useState } from "react";
import { useT } from "@/lib/useT";
import type { Category, Product } from "@/lib/types";

const CATEGORIES: Category[] = ["Outerwear", "Shirts", "Dresses", "Accessories"];
const SIZES = ["S", "M", "L", "XL", "ONE SIZE"];

export interface ProductFormValues {
  nameId: string;
  nameEn: string;
  descId: string;
  descEn: string;
  category: Category;
  basePriceIdr: number;
  isLimited: boolean;
  isActive: boolean;
  imageUrl: string;
  sizes: { size: string; stock: number }[];
}

// Product add/edit form (KTLG-1..4). Works for both create and edit.
export default function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Product;
  onSave: (values: ProductFormValues) => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  const [nameId, setNameId] = useState(initial?.name.id ?? "");
  const [nameEn, setNameEn] = useState(initial?.name.en ?? "");
  const [descId, setDescId] = useState(initial?.description.id ?? "");
  const [descEn, setDescEn] = useState(initial?.description.en ?? "");
  const [category, setCategory] = useState<Category>(
    initial?.category ?? "Shirts"
  );
  const [price, setPrice] = useState(initial?.basePriceIdr ?? 1500000);
  const [isLimited, setIsLimited] = useState(initial?.isLimited ?? false);
  const [isActive, setIsActive] = useState(
    initial?.isActive === false ? false : true
  );
  const [imageUrl, setImageUrl] = useState(
    initial?.images[0]?.url ??
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZWJN7jR4lqLQ2K2CKdLPgFm1GPiH-CglPlCDcF8wUUh5SB0VAGZivSHaDzRaM0OmttWVEGbD-VFCIn8SX8EMhQn6TZTY5r1EeJd0tQznBM8sDBOr89mZ61glhfHcnyRDcNk27A-TUeZzo8IZw0_D-ih3j2TAKbNV9CyNwPuHOMAyInfVOXi3RkL0CnlXFVwQ4vA0NqwByY55yGLie32fgoMi9imZtl17d9WYJZgyDrzDeZwyfzzU9"
  );
  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>(
    initial?.variants.map((v) => ({ size: v.size, stock: v.stockQty })) ?? [
      { size: "S", stock: 5 },
      { size: "M", stock: 5 },
      { size: "L", stock: 5 },
    ]
  );

  const setStock = (size: string, stock: number) =>
    setSizes((prev) =>
      prev.map((s) => (s.size === size ? { ...s, stock } : s))
    );

  const canSave =
    nameId.trim() !== "" && nameEn.trim() !== "" && price > 0;

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <label className="font-label-caps text-label-caps text-obsidian uppercase block mb-2">
          {t("nav.explore")} Name (ID)
        </label>
        <input
          value={nameId}
          onChange={(e) => setNameId(e.target.value)}
          className="field-input"
        />
      </div>
      <div>
        <label className="font-label-caps text-label-caps text-obsidian uppercase block mb-2">
          Name (EN)
        </label>
        <input
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          className="field-input"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-label-caps text-label-caps text-obsidian uppercase block mb-2">
            {t("product.size")} / Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="field-input cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-label-caps text-label-caps text-obsidian uppercase block mb-2">
            Price (IDR)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="field-input"
          />
        </div>
      </div>
      <div>
        <label className="font-label-caps text-label-caps text-obsidian uppercase block mb-2">
          Image URL
        </label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="field-input text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="font-label-caps text-label-caps text-obsidian uppercase block mb-2">
            Description (ID)
          </label>
          <textarea
            value={descId}
            onChange={(e) => setDescId(e.target.value)}
            rows={3}
            className="field-input"
          />
        </div>
        <div>
          <label className="font-label-caps text-label-caps text-obsidian uppercase block mb-2">
            Description (EN)
          </label>
          <textarea
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            rows={3}
            className="field-input"
          />
        </div>
      </div>
      <div>
        <label className="font-label-caps text-label-caps text-obsidian uppercase block mb-2">
          {t("product.size")} Stock
        </label>
        <div className="grid grid-cols-2 gap-3">
          {SIZES.filter((s) =>
            sizes.find((x) => x.size === s)
          ).length === 0
            ? sizes.map((s) => (
                <div key={s.size} className="flex items-center gap-2">
                  <span className="w-12 font-label-caps text-label-caps">
                    {s.size}
                  </span>
                  <input
                    type="number"
                    value={s.stock}
                    onChange={(e) => setStock(s.size, Number(e.target.value))}
                    className="field-input"
                  />
                </div>
              ))
            : sizes.map((s) => (
                <div key={s.size} className="flex items-center gap-2">
                  <span className="w-12 font-label-caps text-label-caps">
                    {s.size}
                  </span>
                  <input
                    type="number"
                    value={s.stock}
                    onChange={(e) => setStock(s.size, Number(e.target.value))}
                    className="field-input"
                  />
                </div>
              ))}
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 font-body-md text-body-md text-obsidian cursor-pointer">
          <input
            type="checkbox"
            checked={isLimited}
            onChange={(e) => setIsLimited(e.target.checked)}
            className="h-4 w-4 accent-obsidian"
          />
          Limited Edition
        </label>
        <label className="flex items-center gap-2 font-body-md text-body-md text-obsidian cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 accent-obsidian"
          />
          Active
        </label>
      </div>

      <div className="flex gap-4 pt-2">
        <button
          disabled={!canSave}
          onClick={() =>
            onSave({
              nameId,
              nameEn,
              descId,
              descEn,
              category,
              basePriceIdr: price,
              isLimited,
              isActive,
              imageUrl,
              sizes,
            })
          }
          className="flex-1 bg-obsidian text-paper font-label-caps text-label-caps py-4 hover:bg-graphite disabled:opacity-40"
        >
          {t("common.save")}
        </button>
        <button
          onClick={onCancel}
          className="px-8 font-label-caps text-label-caps text-on-surface-variant border border-silver-subtle py-4 hover:border-obsidian"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
