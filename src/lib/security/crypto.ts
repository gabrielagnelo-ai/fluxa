import crypto from "crypto";
import { getServerEnv } from "@/lib/security/env";

export function hashSensitiveIdentifier(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function encryptSensitive(value: string) {
  const key = getServerEnv().DATA_ENCRYPTION_KEY;
  if (!key) return null;

  const normalizedKey = crypto.createHash("sha256").update(key).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", normalizedKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}
