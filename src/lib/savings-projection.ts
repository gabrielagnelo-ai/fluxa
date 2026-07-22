export const DEFAULT_SAVINGS_MONTHLY_RATE = 0.0125;
export const DEFAULT_SAVINGS_MONTHLY_RATE_LABEL = "1,25% ao mes";

export function projectCompoundBalance({
  principal,
  monthlyRate = DEFAULT_SAVINGS_MONTHLY_RATE,
  months,
  monthlyContribution = 0
}: {
  principal: number;
  monthlyRate?: number;
  months: number;
  monthlyContribution?: number;
}) {
  const safePrincipal = Math.max(0, principal);
  const safeContribution = Math.max(0, monthlyContribution);
  const safeMonths = Math.max(0, Math.floor(months));

  if (safeMonths === 0) return safePrincipal;
  if (monthlyRate <= 0) return safePrincipal + safeContribution * safeMonths;

  const growth = Math.pow(1 + monthlyRate, safeMonths);
  const contributionGrowth = safeContribution * ((growth - 1) / monthlyRate);

  return safePrincipal * growth + contributionGrowth;
}

export function monthlyYield(principal: number, monthlyRate = DEFAULT_SAVINGS_MONTHLY_RATE) {
  return Math.max(0, principal) * monthlyRate;
}

export function monthsUntilDate(date: string | null | undefined, referenceDate = new Date()) {
  if (!date) return null;

  const targetDate = new Date(date);
  if (Number.isNaN(targetDate.getTime()) || targetDate <= referenceDate) return 0;

  const yearDiff = targetDate.getFullYear() - referenceDate.getFullYear();
  const monthDiff = targetDate.getMonth() - referenceDate.getMonth();
  const months = yearDiff * 12 + monthDiff + (targetDate.getDate() > referenceDate.getDate() ? 1 : 0);

  return Math.max(0, months);
}

export function monthsToReachTarget({
  principal,
  target,
  monthlyContribution = 0,
  monthlyRate = DEFAULT_SAVINGS_MONTHLY_RATE,
  maxMonths = 600
}: {
  principal: number;
  target: number;
  monthlyContribution?: number;
  monthlyRate?: number;
  maxMonths?: number;
}) {
  if (target <= 0 || principal >= target) return 0;
  if (principal <= 0 && monthlyContribution <= 0) return null;

  let balance = Math.max(0, principal);

  for (let month = 1; month <= maxMonths; month += 1) {
    balance = balance * (1 + monthlyRate) + Math.max(0, monthlyContribution);
    if (balance >= target) return month;
  }

  return null;
}

export function formatMonthDistance(months: number | null) {
  if (months === null) return "sem previsao";
  if (months <= 0) return "meta atingida";
  if (months === 1) return "1 mes";

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) return `${months} meses`;
  if (remainingMonths === 0) return years === 1 ? "1 ano" : `${years} anos`;

  return `${years} ano${years > 1 ? "s" : ""} e ${remainingMonths} mes${remainingMonths > 1 ? "es" : ""}`;
}
