import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db/models";
import type { OrderStatus } from "@/lib/types";

// PATCH /api/orders/[id]/status — advance/set order status (ORD-2)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { status } = (await req.json()) as { status: OrderStatus };
    updateOrderStatus(id, status);
    return NextResponse.json({ ok: true, id, status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update status" },
      { status: 500 }
    );
  }
}
