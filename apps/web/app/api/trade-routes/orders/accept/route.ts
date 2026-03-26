import { NextRequest, NextResponse } from "next/server";
import { acceptMockOrder } from "../../../../../lib/trade-routes/server-data";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    orderId?: string;
    quotedPriceMist?: string;
    seller?: string;
  };

  if (!body.orderId || !body.quotedPriceMist || !body.seller) {
    return NextResponse.json(
      { error: "Missing orderId, quotedPriceMist or seller." },
      { status: 400 },
    );
  }

  try {
    const order = await acceptMockOrder(body.orderId, body.quotedPriceMist, body.seller);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown accept_order error." },
      { status: 400 },
    );
  }
}
