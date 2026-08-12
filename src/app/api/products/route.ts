import { NextResponse } from "next/server";
import { getAllProducts, createProduct, type ProductInput } from "@/lib/db/models";

// GET /api/products — list all products (KTLG, CUST-1)
export async function GET() {
  const products = getAllProducts();
  return NextResponse.json(products);
}

// POST /api/products — create a product (KTLG-1)
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProductInput;
    if (!body.nameId?.trim() || !body.nameEn?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.basePriceIdr || body.basePriceIdr <= 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }
    const product = createProduct({
      nameId: body.nameId,
      nameEn: body.nameEn,
      descId: body.descId ?? "",
      descEn: body.descEn ?? "",
      category: body.category,
      basePriceIdr: body.basePriceIdr,
      isLimited: !!body.isLimited,
      isActive: body.isActive !== false,
      imageUrl: body.imageUrl,
      sizes:
        body.sizes && body.sizes.length
          ? body.sizes
          : [{ size: "ONE SIZE", stock: 0 }],
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
