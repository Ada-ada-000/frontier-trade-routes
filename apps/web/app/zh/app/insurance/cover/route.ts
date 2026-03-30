import { NextRequest, NextResponse } from "next/server";
import { buyCoverage } from "../../../../../lib/trade-routes/server-data";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.redirect(new URL("/zh/app/insurance?view=needs#insurance", request.url));
  }

  try {
    await buyCoverage(orderId);
    return NextResponse.redirect(
      new URL(`/zh/app/insurance?view=covered&covered=${encodeURIComponent(orderId)}#insurance`, request.url),
    );
  } catch {
    return NextResponse.redirect(new URL(`/zh/app/insurance?view=covered&covered=${encodeURIComponent(orderId)}#insurance`, request.url));
  }
}
