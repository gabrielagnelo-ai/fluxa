import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerEnv } from "@/lib/security/env";
import { isBelvoConfigured } from "@/lib/belvo/server";
import { secureLogger } from "@/lib/security/logger";
import { redact } from "@/lib/security/redaction";

function isAuthorized(request: NextRequest) {
  const secret = getServerEnv().BELVO_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const headerSecret = request.headers.get("x-belvo-webhook-secret") || request.headers.get("x-webhook-secret");
  return headerSecret === secret;
}

export async function POST(request: NextRequest) {
  if (!isBelvoConfigured()) {
    return NextResponse.json({ error: "Belvo disabled" }, { status: 404 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventId = String(payload.id ?? payload.event_id ?? payload.webhook_id ?? crypto.randomUUID());
  const eventType = String(payload.event_type ?? payload.type ?? "unknown");

  try {
    const existing = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: "belvo",
          eventId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await prisma.webhookEvent.create({
      data: {
        provider: "belvo",
        eventId,
        eventType,
        status: "RECEIVED",
        rawPayloadRedacted: redact(payload) as object
      }
    });

    // TODO: When Belvo account/link payload is finalized, enqueue sync jobs here.
    await prisma.webhookEvent.update({
      where: {
        provider_eventId: {
          provider: "belvo",
          eventId
        }
      },
      data: {
        status: "PROCESSED",
        processedAt: new Date()
      }
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    secureLogger.error("Belvo webhook processing failed", { error, eventType });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
