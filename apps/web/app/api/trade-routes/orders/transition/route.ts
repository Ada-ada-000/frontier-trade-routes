import { NextRequest, NextResponse } from "next/server";
import {
  completeMockDelivery,
  confirmMockPickup,
  sellerTimeoutMockDelivery,
} from "../../../../../lib/trade-routes/server-data";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      actor?: string;
      action?: "confirm_pickup" | "complete_delivery" | "seller_timeout_complete";
    };

    if (!body.orderId || !body.actor || !body.action) {
      return NextResponse.json({ error: "Missing orderId, actor, or action." }, { status: 400 });
    }

    const order =
      body.action === "confirm_pickup"
        ? await confirmMockPickup(body.orderId, body.actor)
        : body.action === "complete_delivery"
          ? await completeMockDelivery(body.orderId, body.actor)
          : await sellerTimeoutMockDelivery(body.orderId, body.actor);

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to transition order.",
      },
      { status: 400 },
    );
  }
}
