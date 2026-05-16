const BELVO_SCOPES = "read_institutions,write_links,read_links,read_consents,write_consents,write_consent_callback,delete_consents";
const BELVO_RESOURCES = ["ACCOUNTS", "TRANSACTIONS", "OWNERS", "BILLS"];

function getBelvoBaseUrl() {
  return process.env.BELVO_ENVIRONMENT === "production" ? "https://api.belvo.com" : "https://sandbox.belvo.com";
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function isBelvoConfigured() {
  return Boolean(process.env.BELVO_SECRET_ID && process.env.BELVO_SECRET_PASSWORD);
}

export async function createBelvoWidgetUrl({
  cpf,
  name,
  consentDays = 183
}: {
  cpf: string;
  name: string;
  consentDays?: 92 | 183 | 275 | 366;
}) {
  const secretId = process.env.BELVO_SECRET_ID;
  const secretPassword = process.env.BELVO_SECRET_PASSWORD;
  if (!secretId || !secretPassword) {
    throw new Error("Configure BELVO_SECRET_ID e BELVO_SECRET_PASSWORD para testar a Belvo.");
  }

  const appUrl = getAppUrl().replace(/\/$/, "");
  const basicAuth = Buffer.from(`${secretId}:${secretPassword}`).toString("base64");
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
      stale_in: "90d",
      widget: {
        openfinance_feature: "consent_link_creation",
        callback_urls: {
          success: `${appUrl}/open-finance/callback?status=success`,
          exit: `${appUrl}/open-finance/callback?status=exit`,
          event: `${appUrl}/open-finance/callback?status=event`
        },
        branding: {
          company_icon: `${appUrl}/favicon.ico`,
          company_logo: `${appUrl}/favicon.ico`,
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
          purpose: "Organização financeira pessoal, análise de gastos e visão consolidada da vida financeira no Fluxa.",
          terms_and_conditions_url: appUrl,
          permissions: ["REGISTER", "ACCOUNTS", "CREDIT_CARDS", "CREDIT_OPERATIONS"],
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
    console.error("Belvo token error", response.status, errorBody);
    throw new Error("A Belvo não gerou o token. Verifique chave, ambiente sandbox/produção e dados de CPF/nome.");
  }

  const data = (await response.json()) as { access?: string };
  if (!data.access) throw new Error("A Belvo respondeu sem access token.");

  const widgetUrl = new URL("https://widget.belvo.io/");
  widgetUrl.searchParams.set("access_token", data.access);
  widgetUrl.searchParams.set("locale", "pt");
  widgetUrl.searchParams.set("integration_type", "openfinance");

  return widgetUrl.toString();
}
