import { NextRequest, NextResponse } from "next/server";
import { buyCoverage } from "../../../../../lib/trade-routes/server-data";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    orderId?: string;
  };

  if (!body.orderId) {
    return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
  }

  try {
    const result = await buyCoverage(body.orderId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown coverage error." },
      { status: 400 },
    );
  }
}
