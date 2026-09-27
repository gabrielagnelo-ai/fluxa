import assert from "node:assert/strict";
import { test } from "node:test";
import { authErrorMessage, authSiteUrl, safeAuthDestination, validHttpUrl } from "./auth-flow";
import { exchangeEmailLink } from "./email-auth";
import { hasVerifiedRecoverySession, isRecentRecoveryClaims } from "./recovery";
import { isNavigationActive, mobilePrimaryItems, navigationItems } from "../../components/layout/navigation";

test("authentication return paths reject external and encoded redirect attacks", () => {
  for (const input of ["https://example.org", "//example.org", "/\\example.org", "javascript:alert(1)", "/%2fexample.org", "/dashboard\n//example.org", "/unknown", null, ["/planning"]]) {
    assert.equal(safeAuthDestination(input), "/dashboard", String(input));
  }
  assert.equal(safeAuthDestination("/transactions?start=2026-09-01&end=2026-09-30"), "/transactions?start=2026-09-01&end=2026-09-30");
  assert.equal(safeAuthDestination("/new-password"), "/new-password");
});

test("email links use configured origins, never arbitrary request hosts or insecure production URLs", () => {
  assert.equal(authSiteUrl({ NODE_ENV: "production" }), undefined);
  assert.equal(authSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://example.org", VERCEL_URL: "safe.vercel.app" }), undefined);
  assert.equal(authSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://fluxa.example/" }), "https://fluxa.example");
  assert.equal(authSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "fluxa.example", VERCEL_URL: "preview.vercel.app" }), "https://fluxa.example");
  assert.equal(authSiteUrl({ NODE_ENV: "development" }), "http://localhost:3000");
  assert.equal(validHttpUrl("https://user:secret@example.org"), undefined);
  assert.equal(validHttpUrl("not a URL"), undefined);
  assert.equal(validHttpUrl("http://localhost:3001"), "http://localhost:3001");
});

test("provider failures become actionable Portuguese messages without leaking provider text", () => {
  assert.match(authErrorMessage({ code: "invalid_credentials" }), /E-mail ou senha incorretos/);
  assert.match(authErrorMessage({ code: "email_not_confirmed" }), /Confirme seu e-mail/);
  assert.match(authErrorMessage({ status: 429 }), /Aguarde alguns minutos/);
  assert.match(authErrorMessage(new TypeError("fetch failed https://private.example")), /indisponível/);
  assert.doesNotMatch(authErrorMessage(new Error("INTERNAL KEY secret-value")), /KEY|secret-value/);
  assert.match(authErrorMessage({ code: "otp_expired" }), /expirou/);
});

function recoveryClaims(method = "recovery", now = Math.floor(Date.now() / 1000)) {
  return { sub: "user-test", session_id: "session-test", exp: now + 3600, amr: [{ method, timestamp: now }] };
}

function authMock(options: { error?: boolean; noSession?: boolean; throws?: boolean; recovery?: boolean; invalidSignature?: boolean } = {}) {
  const calls: string[] = [];
  const run = async (kind: string) => {
    calls.push(kind);
    if (options.throws) throw new TypeError("fetch failed");
    return { data: { user: { id: "user-test" }, session: options.noSession ? null : { access_token: "test-only" } }, error: options.error ? { code: "otp_expired", message: "Expired" } : null };
  };
  return { calls, auth: {
    exchangeCodeForSession: () => run("pkce"), verifyOtp: () => run("otp"),
    getUser: async () => ({ data: { user: { id: "user-test" } }, error: null }),
    getClaims: async () => ({ data: { claims: recoveryClaims(options.recovery ? "recovery" : "password") }, error: options.invalidSignature ? { message: "Invalid signature" } : null })
  } as unknown as Parameters<typeof exchangeEmailLink>[1] & Parameters<typeof hasVerifiedRecoverySession>[0] };
}

test("PKCE recovery exchange leads to password form with no token in the destination", async () => {
  const mock = authMock({ recovery: true });
  const result = await exchangeEmailLink(new URLSearchParams({ code: "test-code", next: "/new-password" }), mock.auth);
  assert.deepEqual(result, { destination: "/new-password", success: true });
  assert.deepEqual(mock.calls, ["pkce"]);
});

test("SSR recovery and confirmation templates verify OTP and choose safe destinations", async () => {
  const recovery = authMock({ recovery: true });
  const mock = authMock();
  assert.deepEqual(await exchangeEmailLink(new URLSearchParams({ token_hash: "test-token", type: "recovery", next: "https://example.org" }), recovery.auth), { destination: "/new-password", success: true });
  assert.deepEqual(await exchangeEmailLink(new URLSearchParams({ token_hash: "test-token", type: "email", next: "//example.org" }), mock.auth), { destination: "/email-confirmed", success: true });
  assert.deepEqual(mock.calls, ["otp"]);
  assert.deepEqual(recovery.calls, ["otp"]);
});

test("forged next/type values and ordinary sign-in cannot authorize password recovery", async () => {
  const ordinary = authMock();
  for (const next of ["/new-password", "/new-password?example=1"]) {
    const result = await exchangeEmailLink(new URLSearchParams({ code: "test-code", next }), ordinary.auth);
    assert.equal(result.success, false);
    assert.match(result.destination, /^\/auth-error/);
  }
  assert.equal((await exchangeEmailLink(new URLSearchParams({ code: "test-code", type: "recovery" }), ordinary.auth)).success, false);
  assert.equal(await hasVerifiedRecoverySession(ordinary.auth), false);
  assert.equal(await hasVerifiedRecoverySession(authMock({ recovery: true }).auth), true);
  assert.equal(await hasVerifiedRecoverySession(authMock({ recovery: true, invalidSignature: true }).auth), false);
});

test("recovery authorization is recent, session-bound, and excludes user-editable metadata", () => {
  const now = 1_900_000_000;
  const valid = recoveryClaims("recovery", now);
  assert.equal(isRecentRecoveryClaims(valid, "user-test", now), true);
  assert.equal(isRecentRecoveryClaims(valid, "another-user", now), false);
  assert.equal(isRecentRecoveryClaims({ ...valid, exp: now - 1 }, "user-test", now), false);
  assert.equal(isRecentRecoveryClaims({ ...valid, session_id: "" }, "user-test", now), false);
  assert.equal(isRecentRecoveryClaims(recoveryClaims("recovery", now - 901), "user-test", now), false);
  assert.equal(isRecentRecoveryClaims(recoveryClaims("recovery", now + 120), "user-test", now), false);
  assert.equal(isRecentRecoveryClaims({ ...valid, amr: [], user_metadata: { amr: valid.amr } }, "user-test", now), false);
  assert.equal(isRecentRecoveryClaims(recoveryClaims("password", now), "user-test", now), false);
});

test("invalid, expired and missing-session email links never enter a protected destination", async () => {
  for (const options of [{ error: true }, { noSession: true }, { throws: true }]) {
    const mock = authMock(options);
    const result = await exchangeEmailLink(new URLSearchParams({ code: "test-code", next: "/new-password" }), mock.auth);
    assert.equal(result.success, false);
    assert.match(result.destination, /^\/auth-error\?flow=recovery/);
    assert.doesNotMatch(result.destination, /test-code/);
  }
  const mock = authMock();
  assert.equal((await exchangeEmailLink(new URLSearchParams({ token_hash: "test-token", type: "invalid" }), mock.auth)).success, false);
  assert.equal((await exchangeEmailLink(new URLSearchParams({ error: "access_denied", code: "test-code" }), mock.auth)).success, false);
  assert.deepEqual(mock.calls, []);
});

test("mobile navigation keeps four primary tasks and the shared menu includes all app areas", () => {
  assert.equal(mobilePrimaryItems.length, 4);
  for (const href of ["/dashboard", "/transactions", "/planning", "/import", "/goals", "/investments", "/insights", "/settings", "/open-finance", "/privacy"]) assert.ok(navigationItems.some((item) => item.href === href), href);
  assert.equal(isNavigationActive("/investments/details", "/investments"), true);
  assert.equal(isNavigationActive("/investments-extra", "/investments"), false);
});
