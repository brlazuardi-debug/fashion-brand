import { NextResponse } from "next/server";
import { setTrackingNumber } from "@/lib/db/models";

// PATCH /api/orders/[id]/tracking — set international tracking number (ORD-4)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { trackingNumber } = (await req.json()) as { trackingNumber: string };
    setTrackingNumber(id, trackingNumber);
    return NextResponse.json({ ok: true, id, trackingNumber });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to set tracking" },
      { status: 500 }
    );
  }
}
