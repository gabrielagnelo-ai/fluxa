import { redact } from "@/lib/security/redaction";

type LogContext = Record<string, unknown>;

function write(level: "info" | "warn" | "error", message: string, context?: LogContext) {
  const payload = context ? redact(context) : undefined;
  const entry = payload ? [`[${level}] ${message}`, payload] : [`[${level}] ${message}`];

  if (level === "error") {
    console.error(...entry);
    return;
  }

  if (level === "warn") {
    console.warn(...entry);
    return;
  }

  console.info(...entry);
}

export const secureLogger = {
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    write("error", message, context);
  }
};
