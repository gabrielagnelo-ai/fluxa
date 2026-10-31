import { formatDateInput } from "@/utils/period";
import { PeriodControl } from "./period-control";

/**
 * Dates are turned into yyyy-mm-dd here, on the server, with the same clock that built the range.
 * Sending Date objects to the client re-read them in the visitor's timezone and shifted the day,
 * so "Este mês" showed as "Outro" on the deployed app.
 */
export function PeriodFilter({ start, end }: { start: Date; end: Date }) {
  return <PeriodControl start={formatDateInput(start)} end={formatDateInput(end)} today={formatDateInput(new Date())} />;
}
