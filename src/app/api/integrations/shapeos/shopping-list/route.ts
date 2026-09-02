import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerEnv } from "@/lib/security/env";

export const runtime = "nodejs";

const payloadSchema = z.object({
  version: z.literal(1),
  userEmail: z.string().email().transform((value) => value.trim().toLowerCase()),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  generatedAt: z.string().datetime(),
  days: z.literal(30),
  plan: z.object({
    id: z.string().min(1).max(160),
    name: z.string().min(1).max(160),
  }),
  items: z.array(z.object({
    foodId: z.string().min(1).max(160),
    name: z.string().min(1).max(200),
    category: z.string().max(120),
    quantity: z.number().positive().max(1_000_000),
    unit: z.enum(["g", "kg", "unit"]),
    unitPrice: z.number().nonnegative().max(1_000_000).nullable(),
    subtotal: z.number().nonnegative().max(10_000_000).nullable(),
  })).min(1).max(500),
  summary: z.object({
    estimatedTotal: z.number().positive().max(10_000_000),
    pricedItemCount: z.number().int().nonnegative().max(500),
    missingPriceCount: z.number().int().nonnegative().max(500),
  }),
});

export async function POST(request: Request) {
  const secret = getServerEnv().SHAPEOS_INTEGRATION_SECRET;
  if (!secret || secret.length < 32) {
    return Response.json({ error: "integration_not_configured" }, { status: 503 });
  }

  const timestamp = request.headers.get("x-shapeos-timestamp") ?? "";
  const signature = request.headers.get("x-shapeos-signature") ?? "";
  const timestampSeconds = Number(timestamp);
  if (!Number.isInteger(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > 300) {
    return Response.json({ error: "invalid_timestamp" }, { status: 401 });
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > 256_000 || !validSignature(secret, timestamp, rawBody, signature)) {
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "invalid_payload" }, { status: 422 });
  }

  const payload = parsed.data;
  const computedTotal = roundMoney(payload.items.reduce((total, item) => total + (item.subtotal ?? 0), 0));
  const missingPriceCount = payload.items.filter((item) => item.subtotal == null).length;
  if (computedTotal <= 0 || Math.abs(computedTotal - payload.summary.estimatedTotal) > 0.05) {
    return Response.json({ error: "invalid_total" }, { status: 422 });
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: payload.userEmail, mode: "insensitive" } },
    select: { id: true },
  });
  if (!user) return Response.json({ error: "account_not_found" }, { status: 404 });

  const name = "Alimentação planejada (ShapeOS)";
  const note = integrationNote(payload, missingPriceCount);
  const existing = await prisma.plannedExpense.findFirst({
    where: {
      userId: user.id,
      month: payload.month,
      year: payload.year,
      name,
      note: { startsWith: "[ShapeOS sync]" },
    },
    select: { id: true },
  });

  const expense = existing
    ? await prisma.plannedExpense.update({
        where: { id: existing.id },
        data: { amount: computedTotal, type: "VARIABLE", note },
      })
    : await prisma.plannedExpense.create({
        data: {
          userId: user.id,
          month: payload.month,
          year: payload.year,
          name,
          amount: computedTotal,
          type: "VARIABLE",
          note,
        },
      });

  revalidatePath("/planning");
  revalidatePath("/dashboard");
  revalidatePath("/insights");

  return Response.json({
    ok: true,
    action: existing ? "updated" : "created",
    expenseId: expense.id,
    amount: computedTotal,
    missingPriceCount,
  });
}

function validSignature(secret: string, timestamp: string, rawBody: string, provided: string) {
  if (!/^[a-f0-9]{64}$/i.test(provided)) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex"), "hex");
  const received = Buffer.from(provided, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function integrationNote(payload: z.infer<typeof payloadSchema>, missingPriceCount: number) {
  const pricedItems = payload.items
    .filter((item) => item.subtotal != null)
    .sort((a, b) => (b.subtotal ?? 0) - (a.subtotal ?? 0))
    .slice(0, 12)
    .map((item) => `${item.name}: ${formatQuantity(item.quantity, item.unit)} · ${formatMoney(item.subtotal ?? 0)}`);
  const omitted = Math.max(0, payload.items.length - pricedItems.length - missingPriceCount);

  return [
    "[ShapeOS sync]",
    `${payload.plan.name} · ${payload.days} dias · ${payload.items.length} itens`,
    pricedItems.join("; "),
    omitted > 0 ? `+ ${omitted} item(ns) precificado(s)` : "",
    missingPriceCount > 0 ? `${missingPriceCount} item(ns) sem preço no ShapeOS` : "Todos os itens têm preço",
    `Atualizado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(payload.generatedAt))}`,
  ].filter(Boolean).join("\n");
}

function formatQuantity(quantity: number, unit: "g" | "kg" | "unit") {
  if (unit === "unit") return `${quantity} un.`;
  return `${quantity.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit}`;
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
