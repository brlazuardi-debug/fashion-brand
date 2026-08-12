import { notFound } from "next/navigation";
import { getProduct, getAllProducts } from "@/lib/db/models";
import ProductDetail from "./ProductDetail";

// ============================================================
// Product Detail route (Server Component)
// Reads the product directly from SQLite so the page is correct
// on first paint, SEO-friendly, and 404s server-side when the
// product doesn't exist. Interactivity (cart, wishlist, zoom,
// accordion) is handled by the client <ProductDetail/> below.
// ============================================================
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  const related = getAllProducts()
    .filter((p) => p.id !== product.id && p.isActive !== false)
    .slice(0, 4);

  return <ProductDetail product={product} related={related} />;
}
