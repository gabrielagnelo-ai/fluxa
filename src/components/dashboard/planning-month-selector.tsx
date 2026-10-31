import { PlanningMonthControl } from "./planning-month-control";

function monthKey(date: Date) {
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

/** Month of the plan: computed with the server clock, like the plan itself, then shown as a segmented control. */
export function PlanningMonthSelector({ month, year }: { month: number; year: number }) {
  const now = new Date();
  const current = monthKey(new Date(now.getFullYear(), now.getMonth(), 1));
  const next = monthKey(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  return <PlanningMonthControl selected={{ month, year }} current={current} next={next} />;
}
