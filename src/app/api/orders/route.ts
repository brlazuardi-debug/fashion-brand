import { NextResponse } from "next/server";
import {
  getAllOrders,
  createOrder,
  type NewOrderInput,
} from "@/lib/db/models";

// GET /api/orders — list all orders (ORD-1)
export async function GET() {
  const orders = getAllOrders();
  return NextResponse.json(orders);
}

// POST /api/orders — create an order + decrement stock (PAY, ORD)
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as NewOrderInput;
    if (!body.cart || body.cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!body.shippingAddress?.email) {
      return NextResponse.json(
        { error: "Shipping email is required" },
        { status: 400 }
      );
    }
    const order = createOrder(body);
    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create order" },
      { status: 500 }
    );
  }
}
