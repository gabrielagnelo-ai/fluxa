import { prisma } from "@/lib/prisma";
import { encryptSensitive, hashSensitiveIdentifier } from "@/lib/security/crypto";
import { getServerEnv, requireServerEnv } from "@/lib/security/env";
import { secureLogger } from "@/lib/security/logger";
import { redact } from "@/lib/security/redaction";

const BELVO_SCOPES = "read_institutions,write_links,read_links,read_consents,write_consents,write_consent_callback,delete_consents";
const BELVO_RESOURCES = ["OWNERS", "ACCOUNTS", "TRANSACTIONS"];
const CONSENT_SCOPES = ["REGISTER", "ACCOUNTS", "CREDIT_CARDS", "CREDIT_OPERATIONS"];

function getBelvoBaseUrl() {
  return getServerEnv().BELVO_ENVIRONMENT === "production" ? "https://api.belvo.com" : "https://sandbox.belvo.com";
}

function getAppUrl() {
  return getServerEnv().NEXT_PUBLIC_SITE_URL || getServerEnv().NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function isBelvoConfigured() {
  const env = getServerEnv();
  return Boolean(env.BELVO_SECRET_ID && env.BELVO_SECRET_PASSWORD);
}

export async function createBelvoWidgetUrl({
  userId,
  cpf,
  name,
  consentDays = 183
}: {
  userId: string;
  cpf: string;
  name: string;
  consentDays?: 92 | 183 | 275 | 366;
}) {
  const secretId = requireServerEnv("BELVO_SECRET_ID");
  const secretPassword = requireServerEnv("BELVO_SECRET_PASSWORD");
  const appUrl = getAppUrl().replace(/\/$/, "");
  const basicAuth = Buffer.from(`${secretId}:${secretPassword}`).toString("base64");
  const expiresAt = new Date(Date.now() + consentDays * 24 * 60 * 60 * 1000);

  await prisma.openFinanceConsent.create({
    data: {
      userId,
      provider: "belvo",
      status: "PENDING",
      scopes: BELVO_RESOURCES,
      expiresAt
    }
  });

  const response = await fetch(`${getBelvoBaseUrl()}/api/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id: secretId,
      password: secretPassword,
      scopes: BELVO_SCOPES,
      fetch_resources: BELVO_RESOURCES,
      stale_in: "300d",
      widget: {
        purpose: "Organização financeira pessoal, categorização de gastos e visão consolidada no Fluxa.",
        openfinance_feature: "consent_link_creation",
        callback_urls: {
          success: `${appUrl}/open-finance/callback?status=success`,
          exit: `${appUrl}/open-finance/callback?status=exit`,
          event: `${appUrl}/open-finance/callback?status=event`
        },
        branding: {
          company_icon: `${appUrl}/branding/fluxa-fx.svg`,
          company_logo: `${appUrl}/branding/fluxa-fx.svg`,
          company_name: "Fluxa",
          company_terms_url: appUrl,
          overlay_background_color: "#0B1220",
          social_proof: false,
          show_belvo_middle_logo: false
        },
        theme: [
          {
            css_key: "--color-primary-base",
            value: "#2563EB"
          }
        ],
        consent: {
          terms_and_conditions_url: appUrl,
          permissions: CONSENT_SCOPES,
          identification_info: [
            {
              type: "CPF",
              number: cpf,
              name
            }
          ],
          default_consent_duration_days: consentDays
        }
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    secureLogger.error("Belvo token generation failed", { status: response.status, body: errorBody });
    throw new Error("A Belvo não gerou o token. Verifique ambiente, credenciais e dados informados.");
  }

  const data = (await response.json()) as { access?: string };
  if (!data.access) throw new Error("A Belvo respondeu sem access token.");

  const widgetUrl = new URL("https://widget.belvo.io/");
  widgetUrl.searchParams.set("access_token", data.access);
  widgetUrl.searchParams.set("locale", "pt");

  return widgetUrl.toString();
}

export async function registerBelvoConnectionFromCallback(userId: string, params: Record<string, string | string[] | undefined>) {
  const rawLinkId = typeof params.link === "string" ? params.link : typeof params.link_id === "string" ? params.link_id : undefined;
  const linkIdHash = rawLinkId ? hashSensitiveIdentifier(rawLinkId) : undefined;

  await prisma.$transaction([
    prisma.openFinanceConsent.updateMany({
      where: { userId, provider: "belvo", status: "PENDING" },
      data: {
        status: "ACTIVE",
        belvoLinkIdHash: linkIdHash
      }
    }),
    prisma.bankConnection.create({
      data: {
        userId,
        provider: "belvo",
        status: "ACTIVE",
        linkIdHash,
        institutionName: typeof params.institution === "string" ? String(redact(params.institution)) : null,
        accountMask: null
      }
    })
  ]);
}

export async function revokeBelvoConnections(userId: string) {
  await prisma.$transaction([
    prisma.openFinanceConsent.updateMany({
      where: { userId, provider: "belvo", status: { in: ["PENDING", "ACTIVE"] } },
      data: {
        status: "REVOKED",
        revokedAt: new Date()
      }
    }),
    prisma.bankConnection.updateMany({
      where: { userId, provider: "belvo", status: { in: ["PENDING", "ACTIVE"] } },
      data: {
        status: "REVOKED",
        disconnectedAt: new Date()
      }
    })
  ]);
}

export function redactBelvoPayload(payload: unknown) {
  const redacted = redact(payload);
  const encrypted = encryptSensitive(JSON.stringify(redacted));
  return encrypted ? { encrypted: true } : redacted;
}
