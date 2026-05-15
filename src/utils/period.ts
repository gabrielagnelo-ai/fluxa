export type PeriodRange = {
  start: Date;
  end: Date;
};

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function endOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: unknown, fallback: Date, endOfDay = false) {
  if (typeof value !== "string" || !value) return fallback;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return fallback;
  return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
}

export function getPeriodRange(params?: Record<string, string | string[] | undefined>): PeriodRange {
  const start = parseDateInput(params?.start, startOfCurrentMonth());
  const end = parseDateInput(params?.end, endOfCurrentMonth(), true);

  if (start > end) {
    return { start: startOfCurrentMonth(), end: endOfCurrentMonth() };
  }

  return { start, end };
}

export function getPeriodLabel({ start, end }: PeriodRange) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${formatter.format(start)} até ${formatter.format(end)}`;
}

export function differenceInCalendarDaysInclusive(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.floor((endUtc - startUtc) / 86_400_000) + 1);
}
