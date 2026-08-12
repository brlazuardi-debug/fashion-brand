import { NextResponse } from "next/server";
import { upsertDemoUser } from "@/lib/db/models";

// POST /api/auth/signin — demo sign-in / register (ACCT-1).
// This is a mock auth for the client demo; it upserts a user by email
// and returns the profile used to scope orders + wishlist.
export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const user = upsertDemoUser(email?.trim() ? email.trim() : "demo@dasilvabatik.com");
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sign in failed" },
      { status: 500 }
    );
  }
}
