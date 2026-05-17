import { NextRequest, NextResponse } from "next/server";
import { secureLogger } from "@/lib/security/logger";
import { processTwilioWhatsAppWebhook, processWhatsAppWebhook, verifyTwilioSignature, verifyWhatsAppWebhook } from "@/lib/whatsapp/server";

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
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const rawBody = await request.text();
      const form = new URLSearchParams(rawBody);
      const validSignature = verifyTwilioSignature(request, form);

      if (!validSignature) {
        secureLogger.warn("Twilio WhatsApp webhook rejected by signature validation");
        return new NextResponse("Forbidden", { status: 403 });
      }

      const reply = await processTwilioWhatsAppWebhook(form);
      return new NextResponse(reply, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" }
      });
    }

    const payload = await request.json();
    await processWhatsAppWebhook(payload);
    return NextResponse.json({ received: true });
  } catch (error) {
    secureLogger.error("WhatsApp webhook failed", { error });
    return NextResponse.json({ received: true });
  }
}
