import { NextResponse } from "next/server";
import {
  getProduct,
  updateProduct,
  deleteProduct,
  type ProductInput,
} from "@/lib/db/models";

// GET /api/products/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

// PUT /api/products/[id] — update (KTLG-1..4)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = (await req.json()) as Partial<ProductInput>;
    const product = updateProduct(id, {
      nameId: body.nameId,
      nameEn: body.nameEn,
      descId: body.descId,
      descEn: body.descEn,
      category: body.category,
      basePriceIdr: body.basePriceIdr,
      isLimited: body.isLimited,
      isActive: body.isActive,
      imageUrl: body.imageUrl,
      sizes: body.sizes,
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — delete (KTLG-1)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteProduct(id);
  return NextResponse.json({ ok: true });
}
