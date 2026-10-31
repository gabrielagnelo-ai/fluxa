import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
  // The opening engine has a content hash in its file name: cache it for a year.
  async headers() {
    return [{ source: "/abertura/:arquivo*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  }
};

export default nextConfig;
