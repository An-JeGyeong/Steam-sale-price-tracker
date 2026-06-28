import { NextRequest, NextResponse } from "next/server";

// POST only — GET would allow CSRF logout via <img src="/api/auth/logout">
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("steam_id", "", { maxAge: 0, path: "/" });
  return res;
}

// Redirect GET requests to home without logging out
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/", req.url));
}
