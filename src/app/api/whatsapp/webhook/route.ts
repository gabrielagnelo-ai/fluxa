import { NextRequest, NextResponse } from "next/server";
import { secureLogger } from "@/lib/security/logger";
import { processWhatsAppWebhook, verifyWhatsAppWebhook } from "@/lib/whatsapp/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const challenge = verifyWhatsAppWebhook(
    searchParams.get("hub.mode"),
    searchParams.get("hub.verify_token"),
    searchParams.get("hub.challenge")
  );

  if (!challenge) return new NextResponse("Forbidden", { status: 403 });
  return new NextResponse(challenge, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    await processWhatsAppWebhook(payload);
    return NextResponse.json({ received: true });
  } catch (error) {
    secureLogger.error("WhatsApp webhook failed", { error });
    return NextResponse.json({ received: true });
  }
}
