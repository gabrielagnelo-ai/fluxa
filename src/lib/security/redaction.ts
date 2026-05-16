const redactionPatterns = [
  { pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, replacement: "[CPF_REDACTED]" },
  { pattern: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, replacement: "[CNPJ_REDACTED]" },
  { pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replacement: "[EMAIL_REDACTED]" },
  { pattern: /(access_token|refresh_token|secret|password|authorization|api[_-]?key|link_id)["']?\s*[:=]\s*["']?[^"',}\s]+/gi, replacement: "$1=[REDACTED]" },
  { pattern: /(Bearer|Basic)\s+[A-Za-z0-9+/=._-]+/g, replacement: "$1 [REDACTED]" },
  { pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, replacement: "[UUID_REDACTED]" }
];

export function redact(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    return redactionPatterns.reduce((output, item) => output.replace(item.pattern, item.replacement), value);
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redact(value.message),
      stack: process.env.NODE_ENV === "development" ? redact(value.stack) : undefined
    };
  }
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => {
        if (/token|secret|password|authorization|cpf|cnpj|document|account|agency|link/i.test(key)) {
          return [key, "[REDACTED]"];
        }
        return [key, redact(item)];
      })
    );
  }
  return "[UNSUPPORTED_REDACTED]";
}

export function maskDocument(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

export function maskAccount(value: string) {
  const cleaned = value.replace(/\s/g, "");
  if (cleaned.length <= 4) return "****";
  return `•••• ${cleaned.slice(-4)}`;
}

export function sanitizeTransactionForAI(transaction: {
  description: string;
  amount: number;
  date?: string;
  type: string;
}) {
  const description = String(redact(transaction.description))
    .replace(/\b(ag[eê]ncia|conta|cpf|cnpj)\b[\s:.-]*\S+/gi, "$1 [REDACTED]")
    .replace(/\b\d{5,}\b/g, "[NUMBER_REDACTED]")
    .trim();

  return {
    description,
    amount: transaction.amount,
    month: transaction.date ? transaction.date.slice(0, 7) : undefined,
    type: transaction.type
  };
}
