import { NextResponse, type NextRequest } from "next/server";
import { createClient, isSupabaseConfigured } from "./server";
import { exchangeEmailLink } from "./email-auth";

export async function completeEmailAuthentication(request: NextRequest) {
  let destination = "/auth-error?reason=unavailable";
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const result = await exchangeEmailLink(request.nextUrl.searchParams, supabase.auth);
      destination = result.destination;
    } catch {
      // Tokens and provider details must never appear in a redirect or log.
    }
  }
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
