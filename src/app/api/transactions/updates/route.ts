import { NextResponse } from "next/server";
import { getTransactionUpdateSnapshotForCurrentUser } from "@/services/finance-data-service";

export const dynamic = "force-dynamic";
export const preferredRegion = "gru1";

export async function GET() {
  const snapshot = await getTransactionUpdateSnapshotForCurrentUser();

  if (!snapshot) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    ...snapshot
  });
}
