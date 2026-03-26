import { NextRequest, NextResponse } from "next/server";
import { updateIntelReport } from "../../../../lib/trade-routes/server-data";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    reportId?: string;
    action?: "support" | "dispute" | "resolve";
    actor?: string;
  };

  if (!body.reportId || !body.action) {
    return NextResponse.json({ error: "Missing reportId or action." }, { status: 400 });
  }

  try {
    const report = await updateIntelReport(body.reportId, body.action, body.actor);
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown intel action error." },
      { status: 400 },
    );
  }
}
