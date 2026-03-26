import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "frontier-trade-routes-api",
    now: new Date().toISOString(),
  });
}
