import { NextResponse } from "next/server";
import { getTradeRoutesSnapshot } from "../../../../lib/trade-routes/server-data";

export async function GET() {
  const snapshot = await getTradeRoutesSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
