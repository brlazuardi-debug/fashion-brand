import { NextResponse } from "next/server";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/db/models";

// GET /api/wishlist?userId=... — list wishlist (CUST-4)
export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  return NextResponse.json(getWishlist(userId));
}

// POST /api/wishlist — add item (CUST-4)
export async function POST(req: Request) {
  try {
    const { userId, productId } = (await req.json()) as {
      userId: string;
      productId: string;
    };
    if (!userId || !productId) {
      return NextResponse.json(
        { error: "userId and productId required" },
        { status: 400 }
      );
    }
    addToWishlist(userId, productId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add" },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist?userId=...&productId=... — remove item (CUST-4)
export async function DELETE(req: Request) {
  const params = new URL(req.url).searchParams;
  const userId = params.get("userId");
  const productId = params.get("productId");
  if (!userId || !productId) {
    return NextResponse.json(
      { error: "userId and productId required" },
      { status: 400 }
    );
  }
  removeFromWishlist(userId, productId);
  return NextResponse.json({ ok: true });
}
